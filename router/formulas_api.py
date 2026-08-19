"""
공식(Formula) 조회/관리 API.

storage.py 의 Storage 클래스(TinyDB, data/formulas.json)를 그대로 사용한다.
characters/groups 라우터와 동일한 패턴: FastAPI + pydantic 검증 + Storage CRUD.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .deps import storage, get_groups_by_id

router = APIRouter(prefix="/api/formulas", tags=["formulas"])


class FormulaIn(BaseModel):
    id: str
    name: str
    expression: str
    description: str | None = None


class FormulaOut(FormulaIn):
    pass


@router.get("", response_model=list[FormulaOut])
def list_formulas():
    """모든 공식 목록을 반환한다."""
    return storage.get_formulas()


@router.get("/{formula_id}", response_model=FormulaOut)
def get_formula(formula_id: str):
    formula = storage.get_formula(formula_id)
    if formula is None:
        raise HTTPException(status_code=404, detail=f"공식 '{formula_id}' 을(를) 찾을 수 없습니다.")
    return formula


@router.post("", response_model=FormulaOut, status_code=201)
def create_formula(formula: FormulaIn):
    if storage.get_formula(formula.id) is not None:
        raise HTTPException(status_code=409, detail=f"이미 존재하는 공식 id 입니다: {formula.id}")
    storage.save_formula(formula.model_dump())
    return formula


@router.put("/{formula_id}", response_model=FormulaOut)
def update_formula(formula_id: str, formula: FormulaIn):
    if formula.id != formula_id:
        raise HTTPException(status_code=400, detail="URL의 id와 본문의 id가 일치하지 않습니다.")
    if storage.get_formula(formula_id) is None:
        raise HTTPException(status_code=404, detail=f"공식 '{formula_id}' 을(를) 찾을 수 없습니다.")
    storage.save_formula(formula.model_dump())
    return formula


@router.delete("/{formula_id}", status_code=204)
def delete_formula(formula_id: str):
    if storage.get_formula(formula_id) is None:
        raise HTTPException(status_code=404, detail=f"공식 '{formula_id}' 을(를) 찾을 수 없습니다.")
    storage.delete_formula(formula_id)