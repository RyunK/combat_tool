# 전투 GM 계산기 (뼈대 버전)

로컬에서 돌아가는 TRPG/전투 판정용 GM 계산기입니다. 다른 플랫폼(디스코드 등)으로 받은
플레이어 선언을 여기서 시전자/대상/스킬로 설정해서 대미지를 계산합니다.

## 실행 방법 (비개발자용)

1. [python.org](https://www.python.org/downloads/) 에서 Python 3.10 이상 설치 (설치 시 "Add to PATH" 체크)
2. 이 폴더를 원하는 곳에 압축 해제
3. Windows는 `run.bat`, macOS/Linux는 `run.sh` 더블클릭 (Mac은 터미널에서 `./run.sh`)
4. 처음 실행 시 필요한 패키지를 자동 설치하고, 이후 브라우저가 자동으로 열립니다 (http://127.0.0.1:8000)

## 폴더 구조

```
combat_tool/
├── run.bat / run.sh     # 실행 진입점
├── main.py              # FastAPI 서버 (라우트 전부 여기 있음)
├── engine/               # 핵심 로직 (UI와 무관하게 동작하는 순수 계산 코드)
│   ├── models.py          # StatDefinition, StatusEffect, Group, Character 정의
│   ├── stat_calculator.py # 그룹 상태 + 개인 상태를 합쳐서 '유효 스탯' 계산
│   ├── formula.py         # 대미지 계산식을 안전하게 평가 (simpleeval)
│   ├── mod_loader.py      # mods/ 폴더에서 스킬·공식 JSON 로드
│   ├── skill.py           # 스킬 실행 (공식 + 변수 매핑)
│   └── storage.py         # 캐릭터/그룹을 JSON(TinyDB)에 저장
├── mods/                 # ★ 확장/공유 가능한 콘텐츠 (스킬, 대미지 공식)
│   └── core/               # 기본 제공 예시 모드팩
│       ├── manifest.json
│       ├── formulas/*.json
│       └── skills/*.json
├── data/                 # 실행하면서 만든 캐릭터/그룹 데이터 (TinyDB, JSON)
└── web/                  # 화면 (Jinja2 템플릿 + CSS)
```

## 핵심 개념

### 그룹 (Group)
그룹은 "진영"에만 쓰이는 게 아니라 **자유 라벨(category)**을 가진 묶음입니다.
- `category="faction"` → 플레이어팀 / 몬스터팀 같은 진영
- `category="role"` → 탱커 / 힐러 / 딜러 같은 역할
- 캐릭터는 여러 그룹에 동시에 속할 수 있습니다 (예: "플레이어팀" + "탱커" 동시 소속)

그룹에는 두 가지를 지정할 수 있습니다.
1. **요구 스탯(stat_schema)**: 이 그룹 소속 캐릭터가 가져야 할 스탯과 기본값
   (예: 탱커 그룹 → `HP=150`, `DEF=10`)
2. **그룹 상태(statuses)**: 이 그룹 소속 전원에게 자동 적용되는 상태
   (예: 탱커 그룹 → `HP percent +20%`)

### 상태 (StatusEffect)
캐릭터 또는 그룹에 **무한히 추가**할 수 있는 버프/디버프입니다.
- `target`: 영향을 주는 스탯 이름 (예: `STR`, `DEF`, 또는 판정용으로 쓰고 싶은 임의의
  이름, 예: `roll`)
- `mode`: `flat`(고정값 가감) 또는 `percent`(%)
- `duration`: 비워두면 무한 지속, 숫자를 넣으면 남은 턴 수 (턴 감소 자동 처리는
  아직 뼈대 단계라 미구현 - 확장 지점으로 남겨둠)

캐릭터의 **유효 스탯**은 `기본 스탯 + 소속 그룹들의 상태 + 개인 상태`를 합산해서
`engine/stat_calculator.py` 가 계산합니다. (flat 먼저 적용 후 percent 적용)

### 스킬 / 대미지 공식 (mods/)
`mods/모드팩이름/formulas/*.json` 에 계산식을, `mods/모드팩이름/skills/*.json` 에
그 계산식에 어떤 변수를 채울지 정의합니다.

```json
// formulas/physical_basic.json
{
  "id": "physical_basic",
  "expression": "max(0, atk * multiplier - def * 0.5)"
}
```

```json
// skills/slash.json
{
  "id": "slash",
  "name": "베기",
  "formula": "physical_basic",
  "variables": {
    "atk": "STR",          // 문자열 = 시전자 스탯 이름
    "multiplier": 1.2,     // 숫자 = 상수
    "def": "target.DEF"    // "target." 접두사 = 대상 스탯 이름
  }
}
```

새 스킬/공식을 추가하려면 이 구조 그대로 JSON 파일만 추가하면 됩니다 (서버 재시작
불필요, 요청마다 다시 로드). 모드팩 폴더(`mods/내모드팩/`) 통째로 복사하면 다른
사람과 공유할 수 있습니다.

## 확장 지점 (다음 단계로 만들면 좋은 것들)

- **상태 지속 턴 자동 감소**: 매 턴 진행 버튼을 누르면 `duration` 이 있는 상태를
  1씩 깎고 0이 되면 자동 제거하는 "턴 진행" 라우트 추가
- **주사위/판정값**: `roll` 같은 이름의 스탯을 상태로 가감해서 판정에 반영하는
  흐름을 스킬 JSON에 `"variables": {"roll": "roll_stat"}` 식으로 확장
- **호스트 방식 멀티유저**: 지금 구조가 이미 FastAPI 서버 - 브라우저 클라이언트
  구조라서, 호스트가 서버를 켜고 `ngrok`/`localtunnel` 등으로 주소를 공유하거나,
  `main.py` 에 WebSocket 라우트를 추가해서 여러 브라우저가 같은 `data/` 상태를
  실시간으로 보게 만들면 됩니다.
- **실행파일 배포**: `PyInstaller` 로 패키징하면 Python 설치 없이도 배포 가능
