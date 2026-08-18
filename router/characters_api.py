from __future__ import annotations

from fastapi import APIRouter, Request
from pydantic import BaseModel

from engine.models import Character, StatusEffect, new_id
from engine.mod_loader import load_mods
from engine.stat_calculator import compute_effective_stats
from .deps import storage, get_groups_by_id, templates

router = APIRouter(prefix="/api/characters", tags=["api"])


@router.get("")
def api_characters_list():
    groups_by_id = get_groups_by_id()
    result = []
    for c in storage.get_characters():
        char = Character(**c)
        effective_stats = compute_effective_stats(char, groups_by_id)
        group_names = [groups_by_id[g].name for g in char.group_ids if g in groups_by_id]
        result.append({
            "id": char.id,
            "name": char.name,
            "group_names": group_names,
            "effective_stats": effective_stats,
            "status_count": len(char.statuses),
        })
    return result

@router.get("/new")
def character_new_form():
    groups = storage.get_groups()
    return {"character": None, "groups": groups}

class CharacterIn(BaseModel):
    id: str | None = None   # 있으면 수정, 없으면 새로 생성
    name: str
    group_ids: list[str] = []
    base_stats: dict[str, float] = {}
    statuses: list[StatusEffect] = []


@router.get("/{cid}")
def api_character_detail(cid: str):
    """
    캐릭터 원본 데이터(그룹 id 목록, 기본 스탯)를 그대로 반환.
    """
    return storage.get_character(cid)

@router.post("")
def api_character_save(payload: CharacterIn):
    # 상태(statuses)는 이 폼에서 안 건드리니, 기존 값을 그대로 보존한다.
    existing = storage.get_character(payload.id) if payload.id else None
    statuses = existing.get("statuses", []) if existing else []

    # print(statuses)
    print(payload.statuses)

    character = Character(
        id=payload.id or new_id(),
        name=payload.name,
        group_ids=payload.group_ids,
        base_stats=payload.base_stats,
        statuses=payload.statuses,
    )
    storage.save_character(character.model_dump())
    return character.model_dump()


@router.delete("/{cid}")
def api_character_delete(cid: str):
    storage.delete_character(cid)
    return {"ok": True}