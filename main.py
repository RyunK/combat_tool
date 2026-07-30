"""
전투 진행용 GM 계산기 - 로컬 웹앱 진입점.

실행: python main.py  (또는 run.bat / run.sh 더블클릭)
브라우저에서 http://127.0.0.1:8000 자동으로 열립니다.
"""
from __future__ import annotations

import threading
import webbrowser

from fastapi import FastAPI, Request, Form
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import uvicorn

from engine.models import Group, Character, StatusEffect, StatDefinition, new_id
from engine.storage import Storage
from engine.stat_calculator import compute_effective_stats, required_stats_for_groups
from engine.mod_loader import load_mods
from engine.skill import execute_skill

from router import  groups, characters, combat

app = FastAPI(title="전투 GM 계산기")
app.mount("/static", StaticFiles(directory="web/static"), name="static")
templates = Jinja2Templates(directory="web/templates")

storage = Storage("data")


# def get_groups_by_id() -> dict[str, Group]:
#     return {g["id"]: Group(**g) for g in storage.get_groups()}


# ---------------------------------------------------------------- 대시보드
@app.get("/")
def index(request: Request):
    formulas, skills, manifests = load_mods("mods")
    return templates.TemplateResponse("index.html", {
        "request": request,
        "group_count": len(storage.get_groups()),
        "char_count": len(storage.get_characters()),
        "formula_count": len(formulas),
        "skill_count": len(skills),
        "manifests": manifests,
    })

app.include_router(groups.router) # 그룹
app.include_router(characters.router) # 캐릭터
app.include_router(combat.router) # 전투 계산




def _open_browser():
    webbrowser.open("http://127.0.0.1:8000")


if __name__ == "__main__":
    threading.Timer(1.2, _open_browser).start()
    uvicorn.run(app, host="127.0.0.1", port=8000)
