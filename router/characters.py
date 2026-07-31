from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse

from engine.models import Character, StatusEffect, new_id
from engine.stat_calculator import compute_effective_stats
from .deps import storage, templates, get_groups_by_id

router = APIRouter(prefix="/characters", tags=["characters"])




@router.get("/new")
def character_new_form(request: Request):
    groups = storage.get_groups()
    return templates.TemplateResponse("character_form.html", {"request": request, "character": None, "groups": groups})


@router.get("/{cid}/edit")
def character_edit_form(request: Request, cid: str):
    character = storage.get_character(cid)
    groups = storage.get_groups()
    return templates.TemplateResponse("character_form.html", {"request": request, "character": character, "groups": groups})


@router.post("/save")
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


@router.get("/{cid}")
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


@router.post("/{cid}/status/add")
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


@router.post("/{cid}/status/{status_id}/remove")
def character_status_remove(cid: str, status_id: str):
    c = storage.get_character(cid)
    if not c:
        return RedirectResponse("/characters", status_code=303)
    character = Character(**c)
    character.statuses = [s for s in character.statuses if s.id != status_id]
    storage.save_character(character.model_dump())
    return RedirectResponse(f"/characters/{cid}", status_code=303)


@router.post("/{cid}/delete")
def character_delete(cid: str):
    storage.delete_character(cid)
    return RedirectResponse("/characters", status_code=303)
