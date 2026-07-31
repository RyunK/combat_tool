from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse

from engine.models import Group, StatDefinition, StatusEffect, new_id
from .deps import storage, templates

router = APIRouter(prefix="/groups", tags=["groups"])


@router.get("")
def groups_list(request: Request):
    groups = storage.get_groups()
    return templates.TemplateResponse("groups_list.html", {"request": request, "groups": groups})


@router.get("/new")
def group_new_form(request: Request):
    return templates.TemplateResponse("group_form.html", {"request": request, "group": None})


@router.get("/{gid}/edit")
def group_edit_form(request: Request, gid: str):
    group = storage.get_group(gid)
    return templates.TemplateResponse("group_form.html", {"request": request, "group": group})


@router.post("/save")
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


@router.post("/{gid}/delete")
def group_delete(gid: str):
    storage.delete_group(gid)
    return RedirectResponse("/groups", status_code=303)
