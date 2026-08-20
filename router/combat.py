from typing import List, Optional, Dict

import traceback

from fastapi import APIRouter, Request
from pydantic import BaseModel

from engine.models import Character, Team, new_id
from engine.stat_calculator import compute_effective_stats
from engine.skill import execute_skill
from .deps import storage, templates, get_groups_by_id

router = APIRouter(prefix="/combat", tags=["combat"])


def _load_skills_and_formulas():
    """
    '스킬' / '수식' 페이지와 동일하게 data 파일(storage) 기준으로 스킬/수식을 읽어온다.
    storage.get_skills() / storage.get_formulas() 가 각각 list[dict] 를 반환한다고 가정하고,
    execute_skill 에서 쓰기 좋게 id -> dict 매핑으로 변환한다.

    실제 storage 모듈의 함수명이 다르다면(get_skill_list 등) 이 함수 안의 두 줄만 맞춰 고치면 된다.
    """
    skills_raw = storage.get_skills()
    formulas_raw = storage.get_formulas()

    skills_by_id = {s["id"]: s for s in skills_raw}
    formulas_by_id = {f["id"]: f for f in formulas_raw}
    return skills_by_id, formulas_by_id


# ---------------------------------------------------------------------------
# 기존 서버 렌더링 폼 (그대로 유지, 다만 스킬/수식 출처를 storage로 통일)
# ---------------------------------------------------------------------------

@router.get("")
def combat_form(request: Request):
    chars = storage.get_characters()
    skills, _formulas = _load_skills_and_formulas()
    return templates.TemplateResponse("combat.html", {
        "request": request, "characters": chars, "skills": list(skills.values()), "result": None,
    })


@router.post("/execute")
async def combat_execute(request: Request):
    form = await request.form()
    caster_id = form.get("caster_id")
    target_id = form.get("target_id")
    skill_id = form.get("skill_id")

    skills, formulas = _load_skills_and_formulas()
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


# ---------------------------------------------------------------------------
# 신규: React 팀 전투 계산 탭을 위한 JSON API
# ---------------------------------------------------------------------------

class MetaCharacter(BaseModel):
    id: str
    name: str


class MetaSkill(BaseModel):
    id: str
    name: str
    formula: Optional[str] = None
    pack: Optional[str] = None


class CombatMetaResponse(BaseModel):
    characters: List[MetaCharacter]
    skills: List[MetaSkill]


@router.get("/api/meta", response_model=CombatMetaResponse)
def combat_meta():
    """캐릭터/스킬 드롭다운을 채우기 위한 목록 (스킬은 skills.json, 즉 storage 기준)."""
    chars = storage.get_characters()
    skills, _formulas = _load_skills_and_formulas()
    return CombatMetaResponse(
        characters=[MetaCharacter(id=c["id"], name=c["name"]) for c in chars],
        skills=[
            MetaSkill(
                id=s["id"],
                name=s["name"],
                formula=s.get("formula") or s.get("formula_id"),
                pack=s.get("pack") or s.get("_pack"),
            )
            for s in skills.values()
        ],
    )

class TeamIn(BaseModel): 
    id: Optional[str] = None
    name: str
    character_ids: list[str] = []

@router.get("/api/teams")
def saved_teams():
    """저장된 팀 목록을 반환 (팀 이름 + 캐릭터 id 목록, 이름 목록 )."""
    teams = storage.get_teams()
    print(teams)
    characters_by_id = {c["id"]: c for c in storage.get_characters()}
    result = []
    for t in teams:
        team_entry = {
            "id": t["id"],
            "name": t["name"],
            "character_ids": t.get("character_ids", []),
            "characters": [
                {"id": cid, "name": characters_by_id[cid]["name"]} for cid in t.get("character_ids", []) if cid in characters_by_id
            ],
        }
        result.append(team_entry)
    return result


@router.post("/api/teams")
def api_team_save(payload: TeamIn):
    team = Team(
        id=payload.id or new_id(),
        name=payload.name,
        character_ids=payload.character_ids,
    )
    storage.save_team(team.model_dump())
    return team.model_dump()

class BatchItem(BaseModel):
    id: str  # 프론트에서 결과를 다시 매칭하기 위한 행 id (row id)
    caster_id: Optional[str] = None
    target_id: Optional[str] = None
    skill_id: Optional[str] = None


class BatchExecuteRequest(BaseModel):
    items: List[BatchItem]


class BatchResultItem(BaseModel):
    id: str
    skill_name: Optional[str] = None
    formula_id: Optional[str] = None
    expression: Optional[str] = None
    variables: Optional[Dict[str, float]] = None
    result: Optional[float] = None
    caster_name: Optional[str] = None
    target_name: Optional[str] = None
    error: Optional[str] = None


class BatchExecuteResponse(BaseModel):
    results: List[BatchResultItem]


@router.post("/api/execute-batch", response_model=BatchExecuteResponse)
async def combat_execute_batch(payload: BatchExecuteRequest):
    """팀 하나의 모든 행(캐릭터/대상/스킬 조합)을 한 번에 계산합니다 ('판정' 버튼)."""
    skills, formulas = _load_skills_and_formulas()
    groups_by_id = get_groups_by_id()

    results: List[BatchResultItem] = []

    for item in payload.items:
        entry = BatchResultItem(id=item.id)
        try:
            if not (item.caster_id and item.target_id and item.skill_id):
                raise ValueError("캐릭터, 대상, 스킬을 모두 선택해주세요.")

            caster_data = storage.get_character(item.caster_id)
            target_data = storage.get_character(item.target_id)
            if not caster_data:
                raise ValueError("시전자 캐릭터를 찾을 수 없습니다.")
            if not target_data:
                raise ValueError("대상 캐릭터를 찾을 수 없습니다.")

            skill = skills.get(item.skill_id)
            if not skill:
                raise ValueError("선택한 스킬을 찾을 수 없습니다.")

            caster = Character(**caster_data)
            target = Character(**target_data)
            caster_stats = compute_effective_stats(caster, groups_by_id)
            target_stats = compute_effective_stats(target, groups_by_id)

            calc = execute_skill(storage, item.skill_id, caster_stats, target_stats)

            entry.skill_name = calc.skill_name
            entry.formula_id = calc.formula_id
            entry.expression = calc.expression
            entry.variables = calc.variables
            entry.result = calc.result
            entry.caster_name = caster.name
            entry.target_name = target.name
        except Exception as e:
            traceback.print_exc()
            print(f"[combat_execute_batch] error for item {item.id}: {e}")
            entry.error = str(e)

        results.append(entry)

    return BatchExecuteResponse(results=results)