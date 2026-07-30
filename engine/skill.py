"""
스킬 JSON 은 '어떤 공식을 쓰고, 그 공식의 변수에 무엇을 채울지'만 정의한다.

스킬 예시:
{
  "id": "slash",
  "name": "베기",
  "formula": "physical_basic",
  "variables": {
    "atk": "STR",          # 문자열이면 시전자 스탯 이름으로 취급
    "multiplier": 1.2,     # 숫자면 그대로 상수
    "def": "target.DEF"    # "target." 접두사면 대상 스탯 이름으로 취급
  }
}
"""
from __future__ import annotations

from .formula import evaluate_formula


def resolve_variable(var, caster_stats: dict, target_stats: dict):
    if isinstance(var, (int, float)):
        return var
    if isinstance(var, str):
        if var.startswith("target."):
            key = var.split(".", 1)[1]
            return target_stats.get(key, 0)
        return caster_stats.get(var, 0)
    return var


def execute_skill(skill: dict, formulas: dict, caster_stats: dict, target_stats: dict) -> dict:
    if skill["formula"] not in formulas:
        raise ValueError(f"공식 '{skill['formula']}' 을(를) 찾을 수 없습니다.")

    formula = formulas[skill["formula"]]
    resolved_vars = {}
    for k, v in skill.get("variables", {}).items():
        resolved_vars[k] = resolve_variable(v, caster_stats, target_stats)

    result = evaluate_formula(formula["expression"], resolved_vars)

    return {
        "skill_name": skill.get("name", skill["id"]),
        "formula_id": formula["id"],
        "expression": formula["expression"],
        "variables": resolved_vars,
        "result": result,
    }
