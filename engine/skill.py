"""
스킬 JSON 은 '어떤 공식을 쓰고, 그 공식의 변수에 무엇을 채울지'만 정의한다.
공식/스킬은 이제 mods/ 하드코딩이 아니라 storage(data/formulas.json, data/skills.json)에서 조회한다.

스킬 예시:
{
  "id": "fireball",
  "name": "파이어볼",
  "formula": "magic_basic",   # formulas 테이블의 id 참조
  "variables": {
    "matk": "INT",
    "multiplier": 1.5,
    "mdef": "target.MDEF"
  },
  "tags": ["magic", "fire"]
}
"""
from __future__ import annotations

from .formula import evaluate_formula
from .storage import Storage


def resolve_variable(var, caster_stats: dict, target_stats: dict):
    if isinstance(var, (int, float)):
        return var
    if isinstance(var, str):
        if var.startswith("target."):
            key = var.split(".", 1)[1]
            return target_stats.get(key, 0)
        return caster_stats.get(var, 0)
    return var


def execute_skill(storage: Storage, skill_id: str, caster_stats: dict, target_stats: dict) -> dict:
    skill = storage.get_skill(skill_id)
    if skill is None:
        raise ValueError(f"스킬 '{skill_id}' 을(를) 찾을 수 없습니다.")

    formula = storage.get_formula(skill["formula"])
    if formula is None:
        raise ValueError(f"공식 '{skill['formula']}' 을(를) 찾을 수 없습니다.")

    resolved_vars = {
        k: resolve_variable(v, caster_stats, target_stats)
        for k, v in skill.get("variables", {}).items()
    }
    result = evaluate_formula(formula["expression"], resolved_vars)

    return {
        "skill_name": skill.get("name", skill["id"]),
        "formula_id": formula["id"],
        "expression": formula["expression"],
        "variables": resolved_vars,
        "result": result,
    }