"""
React 프론트엔드가 호출하는 JSON API.

기존 routers/characters.py, groups.py 등은 서버가 HTML을 직접 그려주는
방식(TemplateResponse)이라 그대로 두고, React로 바꾼 화면은 이 파일에
JSON 엔드포인트로 하나씩 추가해나가면 됩니다.

지금은 '캐릭터 목록' 페이지 하나만 React로 옮기는 시범이라
GET /api/characters 하나만 있습니다.
"""
from __future__ import annotations

from fastapi import APIRouter

from engine.models import Character
from engine.stat_calculator import compute_effective_stats
from .deps import storage, get_groups_by_id

router = APIRouter(prefix="/api", tags=["api"])


@router.get("/characters")
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
