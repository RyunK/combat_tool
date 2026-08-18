"""
라우터들이 공통으로 쓰는 것들.
- storage   : 캐릭터/그룹 저장소 (모든 라우터가 같은 인스턴스를 공유해야 함)
- templates : Jinja2 템플릿 엔진
- get_groups_by_id : 그룹 id -> Group 객체 매핑 (여러 라우터에서 반복 사용)
"""
from __future__ import annotations

from fastapi.templating import Jinja2Templates

from engine.models import Group
from engine.storage import Storage

storage = Storage("data")
templates = Jinja2Templates(directory="web/templates")


def get_groups_by_id() -> dict[str, Group]:
    return {g["id"]: Group(**g) for g in storage.get_groups()}
