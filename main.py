"""
전투 진행용 GM 계산기 - 로컬 웹앱 진입점.

실행: python main.py  (또는 run.bat / run.sh 더블클릭)
브라우저에서 http://127.0.0.1:8901 자동으로 열립니다.

라우터는 routers/ 패키지에 기능별로 분리되어 있습니다.
- routers/index.py       대시보드
- routers/groups.py      그룹 CRUD
- routers/characters.py  캐릭터 CRUD, 상태 추가/제거
- routers/combat.py      전투 계산
- routers/deps.py        공용 storage/templates
"""
from __future__ import annotations

import threading
import webbrowser

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import uvicorn

from router import index, combat, api, characters_api, groups_api, formulas_api, skills_api

app = FastAPI(title="전투 GM 계산기")
app.mount("/static", StaticFiles(directory="web/static"), name="static")

app.include_router(index.router)
app.include_router(combat.router)
app.include_router(api.router)
app.include_router(characters_api.router)
app.include_router(groups_api.router)
app.include_router(formulas_api.router)
app.include_router(skills_api.router)


def _open_browser():
    webbrowser.open("http://127.0.0.1:8901")


if __name__ == "__main__":
    threading.Timer(1.2, _open_browser).start()
    uvicorn.run("main:app", host="127.0.0.1", port=8901, reload=True)
