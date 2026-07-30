"""
전투 진행용 GM 계산기 - 로컬 웹앱 진입점.

실행: python main.py  (또는 run.bat / run.sh 더블클릭)
브라우저에서 http://127.0.0.1:8000 자동으로 열립니다.
"""
from __future__ import annotations

import threading
import webbrowser

from fastapi import FastAPI, Request, Form
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import uvicorn

from engine.models import Group, Character, StatusEffect, StatDefinition, new_id
from engine.storage import Storage
from engine.stat_calculator import compute_effective_stats, required_stats_for_groups
from engine.mod_loader import load_mods
from engine.skill import execute_skill

app = FastAPI(title="전투 GM 계산기")
app.mount("/static", StaticFiles(directory="web/static"), name="static")
templates = Jinja2Templates(directory="web/templates")

storage = Storage("data")


def get_groups_by_id() -> dict[str, Group]:
    return {g["id"]: Group(**g) for g in storage.get_groups()}


# ---------------------------------------------------------------- 대시보드
@app.get("/")
def index(request: Request):
    formulas, skills, manifests = load_mods("mods")
    return templates.TemplateResponse("index.html", {
        "request": request,
        "group_count": len(storage.get_groups()),
        "char_count": len(storage.get_characters()),
        "formula_count": len(formulas),
        "skill_count": len(skills),
        "manifests": manifests,
    })


# ---------------------------------------------------------------- 그룹
@app.get("/groups")
def groups_list(request: Request):
    groups = storage.get_groups()
    return templates.TemplateResponse("groups_list.html", {"request": request, "groups": groups})


@app.get("/groups/new")
def group_new_form(request: Request):
    return templates.TemplateResponse("group_form.html", {"request": request, "group": None})


@app.get("/groups/{gid}/edit")
def group_edit_form(request: Request, gid: str):
    group = storage.get_group(gid)
    return templates.TemplateResponse("group_form.html", {"request": request, "group": group})


@app.post("/groups/save")
async def group_save(request: Request):
    form = await request.form()
    gid = form.get("id") or None

    stat_names = form.getlist("stat_name")
    stat_defaults = form.getlist("stat_default")
    stat_schema = [
        StatDefinition(name=n, default=float(d or 0))
        for n, d in zip(stat_names, stat_defaults) if n.strip()
    ]

    st_names = form.getlist("status_name")
    st_targets = form.getlist("status_target")
    st_modes = form.getlist("status_mode")
    st_values = form.getlist("status_value")
    st_durations = form.getlist("status_duration")
    st_sources = form.getlist("status_source")
    statuses = []
    for n, t, m, v, d, s in zip(st_names, st_targets, st_modes, st_values, st_durations, st_sources):
        if not n.strip():
            continue
        statuses.append(StatusEffect(
            name=n, target=t, mode=m, value=float(v or 0),
            duration=int(d) if d.strip() else None,
            source=s or None,
        ))

    group = Group(
        id=gid or new_id(),
        name=form.get("name", "이름없음"),
        category=form.get("category") or None,
        stat_schema=stat_schema,
        statuses=statuses,
    )
    storage.save_group(group.model_dump())
    return RedirectResponse("/groups", status_code=303)


@app.post("/groups/{gid}/delete")
def group_delete(gid: str):
    storage.delete_group(gid)
    return RedirectResponse("/groups", status_code=303)


# ---------------------------------------------------------------- 캐릭터
@app.get("/characters")
def characters_list(request: Request):
    chars = storage.get_characters()
    groups_by_id = get_groups_by_id()
    rows = []
    for c in chars:
        char = Character(**c)
        eff = compute_effective_stats(char, groups_by_id)
        group_names = [groups_by_id[g].name for g in char.group_ids if g in groups_by_id]
        rows.append({"char": char, "effective_stats": eff, "group_names": group_names})
    return templates.TemplateResponse("characters_list.html", {"request": request, "rows": rows})


@app.get("/characters/new")
def character_new_form(request: Request):
    groups = storage.get_groups()
    return templates.TemplateResponse("character_form.html", {"request": request, "character": None, "groups": groups})


@app.get("/characters/{cid}/edit")
def character_edit_form(request: Request, cid: str):
    character = storage.get_character(cid)
    groups = storage.get_groups()
    return templates.TemplateResponse("character_form.html", {"request": request, "character": character, "groups": groups})


@app.post("/characters/save")
async def character_save(request: Request):
    form = await request.form()
    cid = form.get("id") or None

    group_ids = form.getlist("group_ids")

    stat_names = form.getlist("stat_name")
    stat_values = form.getlist("stat_value")
    base_stats = {}
    for n, v in zip(stat_names, stat_values):
        if n.strip():
            try:
                base_stats[n] = float(v or 0)
            except ValueError:
                base_stats[n] = 0

    existing = storage.get_character(cid) if cid else None
    statuses = existing.get("statuses", []) if existing else []

    character = Character(
        id=cid or new_id(),
        name=form.get("name", "이름없음"),
        group_ids=group_ids,
        base_stats=base_stats,
        statuses=[StatusEffect(**s) for s in statuses],
    )
    storage.save_character(character.model_dump())
    return RedirectResponse(f"/characters/{character.id}", status_code=303)


@app.get("/characters/{cid}")
def character_detail(request: Request, cid: str):
    c = storage.get_character(cid)
    if not c:
        return RedirectResponse("/characters", status_code=303)
    character = Character(**c)
    groups_by_id = get_groups_by_id()
    effective_stats = compute_effective_stats(character, groups_by_id)
    group_objs = [groups_by_id[g] for g in character.group_ids if g in groups_by_id]
    return templates.TemplateResponse("character_detail.html", {
        "request": request,
        "character": character,
        "effective_stats": effective_stats,
        "groups": group_objs,
    })


@app.post("/characters/{cid}/status/add")
async def character_status_add(cid: str, request: Request):
    form = await request.form()
    c = storage.get_character(cid)
    if not c:
        return RedirectResponse("/characters", status_code=303)
    character = Character(**c)
    duration = form.get("duration", "")
    status = StatusEffect(
        name=form.get("name", "상태"),
        target=form.get("target", ""),
        mode=form.get("mode", "flat"),
        value=float(form.get("value") or 0),
        duration=int(duration) if duration.strip() else None,
        source=form.get("source") or None,
        note=form.get("note") or None,
    )
    character.statuses.append(status)
    storage.save_character(character.model_dump())
    return RedirectResponse(f"/characters/{cid}", status_code=303)


@app.post("/characters/{cid}/status/{status_id}/remove")
def character_status_remove(cid: str, status_id: str):
    c = storage.get_character(cid)
    if not c:
        return RedirectResponse("/characters", status_code=303)
    character = Character(**c)
    character.statuses = [s for s in character.statuses if s.id != status_id]
    storage.save_character(character.model_dump())
    return RedirectResponse(f"/characters/{cid}", status_code=303)


@app.post("/characters/{cid}/delete")
def character_delete(cid: str):
    storage.delete_character(cid)
    return RedirectResponse("/characters", status_code=303)


# ---------------------------------------------------------------- 전투 계산
@app.get("/combat")
def combat_form(request: Request):
    chars = storage.get_characters()
    _, skills, _ = load_mods("mods")
    return templates.TemplateResponse("combat.html", {
        "request": request, "characters": chars, "skills": list(skills.values()), "result": None,
    })


@app.post("/combat/execute")
async def combat_execute(request: Request):
    form = await request.form()
    caster_id = form.get("caster_id")
    target_id = form.get("target_id")
    skill_id = form.get("skill_id")

    formulas, skills, _ = load_mods("mods")
    groups_by_id = get_groups_by_id()

    caster = Character(**storage.get_character(caster_id))
    target = Character(**storage.get_character(target_id))
    caster_stats = compute_effective_stats(caster, groups_by_id)
    target_stats = compute_effective_stats(target, groups_by_id)

    skill = skills.get(skill_id)
    error = None
    result = None
    if not skill:
        error = "선택한 스킬을 찾을 수 없습니다."
    else:
        try:
            result = execute_skill(skill, formulas, caster_stats, target_stats)
        except Exception as e:
            error = str(e)

    chars = storage.get_characters()
    return templates.TemplateResponse("combat.html", {
        "request": request,
        "characters": chars,
        "skills": list(skills.values()),
        "result": result,
        "error": error,
        "caster_name": caster.name,
        "target_name": target.name,
        "caster_stats": caster_stats,
        "target_stats": target_stats,
    })


def _open_browser():
    webbrowser.open("http://127.0.0.1:8000")


if __name__ == "__main__":
    threading.Timer(1.2, _open_browser).start()
    uvicorn.run(app, host="127.0.0.1", port=8000)
