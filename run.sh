#!/bin/bash
cd "$(dirname "$0")"

if [ ! -d "venv" ]; then
    echo "[처음 실행] 가상환경을 만들고 필요한 패키지를 설치합니다. 잠시만 기다려주세요..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

echo "서버를 시작합니다. 브라우저가 자동으로 열립니다..."
python main.py
