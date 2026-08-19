"""
스킬(Skill) 조회/관리 API.

storage.py 의 Storage 클래스(TinyDB, data/skills.json)를 그대로 사용한다.
formulas 라우터와 동일한 패턴: FastAPI + pydantic 검증 + Storage CRUD.

스킬의 variables 값은 문자열(스탯 이름 참조, "target." 접두사 포함)이거나
숫자(상수)일 수 있으므로 str | float 유니온으로 받는다.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .deps import storage, get_groups_by_id

router = APIRouter(prefix="/api/skills", tags=["skills"])


class SkillIn(BaseModel):
    id: str
    name: str
    formula: str                              # formulas 테이블의 id 참조
    variables: dict[str, str | float] = {}
    tags: list[str] = []


class SkillOut(SkillIn):
    pass


@router.get("", response_model=list[SkillOut])
def list_skills():
    """모든 스킬 목록을 반환한다."""
    return storage.get_skills()


@router.get("/{skill_id}", response_model=SkillOut)
def get_skill(skill_id: str):
    skill = storage.get_skill(skill_id)
    if skill is None:
        raise HTTPException(status_code=404, detail=f"스킬 '{skill_id}' 을(를) 찾을 수 없습니다.")
    return skill


@router.post("", response_model=SkillOut, status_code=201)
def create_skill(skill: SkillIn):
    if storage.get_skill(skill.id) is not None:
        raise HTTPException(status_code=409, detail=f"이미 존재하는 스킬 id 입니다: {skill.id}")
    if storage.get_formula(skill.formula) is None:
        raise HTTPException(status_code=400, detail=f"존재하지 않는 수식입니다: {skill.formula}")
    storage.save_skill(skill.model_dump())
    return skill


@router.put("/{skill_id}", response_model=SkillOut)
def update_skill(skill_id: str, skill: SkillIn):
    if skill.id != skill_id:
        raise HTTPException(status_code=400, detail="URL의 id와 본문의 id가 일치하지 않습니다.")
    if storage.get_skill(skill_id) is None:
        raise HTTPException(status_code=404, detail=f"스킬 '{skill_id}' 을(를) 찾을 수 없습니다.")
    if storage.get_formula(skill.formula) is None:
        raise HTTPException(status_code=400, detail=f"존재하지 않는 수식입니다: {skill.formula}")
    storage.save_skill(skill.model_dump())
    return skill


@router.delete("/{skill_id}", status_code=204)
def delete_skill(skill_id: str):
    if storage.get_skill(skill_id) is None:
        raise HTTPException(status_code=404, detail=f"스킬 '{skill_id}' 을(를) 찾을 수 없습니다.")
    storage.delete_skill(skill_id)