"""
대미지 계산식(문자열)을 안전하게 평가한다.
파이썬 eval() 을 직접 쓰지 않고 simpleeval 을 사용해 임의 코드 실행을 막는다.

예: expression = "atk * multiplier - def * 0.5"
    variables  = {"atk": 12, "multiplier": 1.2, "def": 4}
"""
import re
from typing import TypedDict

from simpleeval import simple_eval, InvalidExpression
import math


ALLOWED_FUNCTIONS = {
    "max": max,
    "min": min,
    "round": round,
    "abs": abs,
    "floor": math.floor,
    "ceil": math.ceil,
}

class FormulaResult(TypedDict):
    formula: str
    result: float


def evaluate_formula(expression: str, variables: dict) -> FormulaResult:
    try:
        pattern = r'\b(' + '|'.join(map(re.escape, variables.keys())) + r')\b'

        evaluated_expression = re.sub(
            pattern,
            lambda match: str(variables[match.group(0)]),
            expression
        )

        result = simple_eval(
            expression,
            names=variables,
            functions=ALLOWED_FUNCTIONS
        )

        return FormulaResult(formula=evaluated_expression, result=float(result))

    except InvalidExpression as e:
        raise ValueError(f"수식 평가 실패: {expression} ({e})")
