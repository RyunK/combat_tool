"""
캐릭터의 '최종 유효 스탯'을 계산한다.

적용 순서:
1. base_stats 를 시작값으로 둔다.
2. 캐릭터가 속한 모든 그룹의 상태(statuses)를 모은다.
3. 캐릭터 자신의 상태(statuses)를 더한다.
4. flat 상태를 먼저 전부 적용한 뒤, percent 상태를 그 결과값 기준으로 적용한다.
   (예: STR 10에 flat -2, percent -50% 상태가 같이 있으면 (10-2)*0.5 = 4)

status 로 만들 수 있는 것들:
- 스탯 약화: target="STR", mode="flat", value=-3
- 판정값 감소: target="roll", mode="flat", value=-2   (주사위 굴림 등 별도 판정에 사용하고 싶으면
  스킬 실행 시 roll 스탯을 변수로 끌어다 쓰면 됨)
- 그룹 버프: 탱커 그룹 statuses 에 target="HP", mode="percent", value=20 을 넣으면
  그 그룹 소속 캐릭터는 전부 HP +20% 를 받는다.
"""
from __future__ import annotations

from .models import Character, Group, StatusEffect


def collect_statuses(character: Character, groups_by_id: dict[str, Group]) -> list[StatusEffect]:
    statuses: list[StatusEffect] = []
    for gid in character.group_ids:
        g = groups_by_id.get(gid)
        if g:
            statuses.extend(g.statuses)
    statuses.extend(character.statuses)
    return statuses


def compute_effective_stats(character: Character, groups_by_id: dict[str, Group]) -> dict[str, float]:
    stats: dict[str, float] = dict(character.base_stats)
    statuses = collect_statuses(character, groups_by_id)

    for s in statuses:
        if s.mode == "flat":
            stats[s.target] = stats.get(s.target, 0) + s.value

    for s in statuses:
        if s.mode == "percent":
            base = stats.get(s.target, 0)
            stats[s.target] = base + base * (s.value / 100)

    return stats


def required_stats_for_groups(groups: list[Group]) -> dict[str, float]:
    """선택된 그룹들의 stat_schema 를 합쳐서 {스탯이름: 기본값} 딕셔너리로 반환."""
    merged: dict[str, float] = {}
    for g in groups:
        for sd in g.stat_schema:
            merged.setdefault(sd.name, sd.default)
    return merged
