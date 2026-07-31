from __future__ import annotations

from fastapi import APIRouter

from engine.models import Character
from engine.mod_loader import load_mods
from engine.stat_calculator import compute_effective_stats
from .deps import storage, get_groups_by_id

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