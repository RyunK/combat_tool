from __future__ import annotations
from fastapi import APIRouter, Depends

from fastapi import FastAPI, Request, Form
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from engine.models import Group, Character, StatusEffect, StatDefinition, new_id
from engine.storage import Storage


templates = Jinja2Templates(directory="web/templates")

storage = Storage("data")
router = APIRouter()

@router.get("/formulas")
def formulas_list(request: Request):
    formulas = storage.get_formulas()
    return templates.TemplateResponse("formulas_list.html", {"request": request, "formulas": formulas})


@router.get("/formulas/new")
def group_new_form(request: Request):
    return templates.TemplateResponse("formula_form.html", {"request": request, "group": None})


@router.get("/formulas/{gid}/edit")
def group_edit_form(request: Request, gid: str):
    group = storage.get_group(gid)
    return templates.TemplateResponse("formula_form.html", {"request": request, "group": group})


@router.post("/groups/save")
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
    return RedirectResponse("/formulas", status_code=303)


@router.post("/formulas/{gid}/delete")
def group_delete(gid: str):
    storage.delete_group(gid)
    return RedirectResponse("/formulas", status_code=303)