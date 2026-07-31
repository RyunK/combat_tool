from __future__ import annotations

from fastapi import APIRouter

from engine.models import Character
from engine.mod_loader import load_mods
from engine.stat_calculator import compute_effective_stats
from .deps import storage, get_groups_by_id

router = APIRouter(prefix="/api/groups", tags=["api"])


@router.get("")
def api_characters_list():
    groups = storage.get_groups()
    return groups