from __future__ import annotations
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from engine.models import Group, StatDefinition, StatusEffect, new_id
from engine.mod_loader import load_mods
from engine.stat_calculator import compute_effective_stats
from .deps import storage, get_groups_by_id

router = APIRouter(prefix="/api/groups", tags=["groups_api"])

# ---------------------------------------------------- 요청 바디 스키마
 
class GroupIn(BaseModel):
    id: Optional[str] = None
    name: str = "이름없음"
    category: Optional[str] = None
    stat_schema: list[StatDefinition] = []
    statuses: list[StatusEffect] = []


@router.get("")
def api_groups_list():
    groups = storage.get_groups()
    return groups

 
@router.get("/{gid}")
def get_group(gid: str):
    group = storage.get_group(gid)
    if group is None:
        raise HTTPException(status_code=404, detail="그룹을 찾을 수 없습니다")
    return group
 
 
@router.post("")
def create_group(payload: GroupIn):
    group = Group(
        id=payload.id or new_id(),
        name=payload.name,
        category=payload.category,
        stat_schema=payload.stat_schema,
        statuses=payload.statuses,
    )
    storage.save_group(group.model_dump())
    return group
 
 
 
@router.delete("/{gid}")
def delete_group(gid: str):
    existing = storage.get_group(gid)
    if existing is None:
        raise HTTPException(status_code=404, detail="그룹을 찾을 수 없습니다")
    storage.delete_group(gid)
    return {"ok": True}