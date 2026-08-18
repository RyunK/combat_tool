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
 
class StatDefinitionIn(BaseModel):
    name: str
    default: float = 0
 
 
class StatusEffectIn(BaseModel):
    name: str
    target: str
    mode: str
    value: float = 0
    duration: Optional[int] = None
    source: Optional[str] = None
 
 
class GroupIn(BaseModel):
    id: Optional[str] = None
    name: str = "이름없음"
    category: Optional[str] = None
    stat_schema: list[StatDefinitionIn] = []
    statuses: list[StatusEffectIn] = []


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
    stat_schema = [
        StatDefinition(name=s.name, default=s.default)
        for s in payload.stat_schema if s.name.strip()
    ]
    statuses = [
        StatusEffect(
            name=s.name,
            target=s.target,
            mode=s.mode,
            value=s.value,
            duration=s.duration,
            source=s.source,
        )
        for s in payload.statuses if s.name.strip()
    ]
 
    group = Group(
        id=payload.id or new_id(),
        name=payload.name,
        category=payload.category,
        stat_schema=stat_schema,
        statuses=statuses,
    )
    storage.save_group(group.model_dump())
    return group
 
 
@router.put("/{gid}")
def update_group(gid: str, payload: GroupIn):
    existing = storage.get_group(gid)
    if existing is None:
        raise HTTPException(status_code=404, detail="그룹을 찾을 수 없습니다")
 
    stat_schema = [
        StatDefinition(name=s.name, default=s.default)
        for s in payload.stat_schema if s.name.strip()
    ]
    statuses = [
        StatusEffect(
            name=s.name,
            target=s.target,
            mode=s.mode,
            value=s.value,
            duration=s.duration,
            source=s.source,
        )
        for s in payload.statuses if s.name.strip()
    ]
 
    group = Group(
        id=gid,
        name=payload.name,
        category=payload.category,
        stat_schema=stat_schema,
        statuses=statuses,
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