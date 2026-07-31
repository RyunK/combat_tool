from fastapi import APIRouter, Request

from engine.models import Character
from engine.mod_loader import load_mods
from engine.stat_calculator import compute_effective_stats
from engine.skill import execute_skill
from .deps import storage, templates, get_groups_by_id

router = APIRouter(prefix="/combat", tags=["combat"])


@router.get("")
def combat_form(request: Request):
    chars = storage.get_characters()
    _, skills, _ = load_mods("mods")
    return templates.TemplateResponse("combat.html", {
        "request": request, "characters": chars, "skills": list(skills.values()), "result": None,
    })


@router.post("/execute")
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
