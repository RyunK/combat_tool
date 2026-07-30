"""
전투 엔진의 핵심 데이터 모델.

- StatDefinition : 그룹이 요구하는 스탯 하나의 정의 (이름 + 기본값)
- StatusEffect   : 캐릭터 또는 그룹에 붙는 '상태' (버프/디버프).
                    target 스탯을 flat 또는 percent 방식으로 변화시킴.
                    duration 이 None 이면 무한 지속.
- Group          : 진영/역할/종족 등 자유 라벨(category)을 가지는 묶음.
                    - stat_schema: 이 그룹 소속 캐릭터가 가져야 할 스탯 목록
                    - statuses  : 이 그룹 소속 캐릭터 전원에게 적용되는 상태
- Character      : 실제 캐릭터. 여러 그룹에 동시에 속할 수 있음.
"""
from __future__ import annotations

from typing import Literal, Optional
from pydantic import BaseModel, Field
import uuid


def new_id() -> str:
    return uuid.uuid4().hex[:8]


class StatDefinition(BaseModel):
    name: str
    default: float = 0


class StatusEffect(BaseModel):
    id: str = Field(default_factory=new_id)
    name: str
    target: str                     # 영향을 주는 스탯 이름 (예: "STR", "ATK", "roll")
    mode: Literal["flat", "percent"] = "flat"
    value: float = 0
    duration: Optional[int] = None  # None = 무한 지속, 숫자면 남은 턴 수
    source: Optional[str] = None    # 이 상태를 건 주체 (스킬명, 캐릭터명 등)
    note: Optional[str] = None


class Group(BaseModel):
    id: str = Field(default_factory=new_id)
    name: str
    category: Optional[str] = None       # "faction", "role", "species" 등 자유 라벨
    stat_schema: list[StatDefinition] = Field(default_factory=list)
    statuses: list[StatusEffect] = Field(default_factory=list)


class Character(BaseModel):
    id: str = Field(default_factory=new_id)
    name: str
    group_ids: list[str] = Field(default_factory=list)
    base_stats: dict[str, float] = Field(default_factory=dict)
    statuses: list[StatusEffect] = Field(default_factory=list)
    current_hp: Optional[float] = None
