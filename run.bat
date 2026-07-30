@echo off
cd /d "%~dp0"

if not exist venv (
    echo [처음 실행] 가상환경을 만들고 필요한 패키지를 설치합니다. 잠시만 기다려주세요...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate.bat
)

echo 서버를 시작합니다. 브라우저가 자동으로 열립니다...
python main.py
pause
