"""
런타임 데이터(그룹, 캐릭터) 저장소.
mods/ 안의 스킬·공식과 달리, 이건 '이번 세션에서 실제로 만든 캐릭터/그룹' 데이터라서
data/ 폴더의 TinyDB(JSON) 파일에 저장한다.
"""
from __future__ import annotations

from pathlib import Path
from tinydb import TinyDB, Query


class Storage:
    def __init__(self, data_dir: str = "data"):
        Path(data_dir).mkdir(parents=True, exist_ok=True)
        self.db_groups = TinyDB(f"{data_dir}/groups.json", encoding="utf-8", ensure_ascii=False)
        self.db_chars = TinyDB(f"{data_dir}/characters.json", encoding="utf-8", ensure_ascii=False)
        self.db_formulas = TinyDB(f"{data_dir}/formulas.json", encoding="utf-8", ensure_ascii=False)
        self.db_skills = TinyDB(f"{data_dir}/skills.json", encoding="utf-8", ensure_ascii=False)

    # ---- groups ----
    def save_group(self, group: dict):
        Q = Query()
        self.db_groups.upsert(group, Q.id == group["id"])

    def get_groups(self) -> list[dict]:
        return self.db_groups.all()

    def get_group(self, gid: str) -> dict | None:
        Q = Query()
        return self.db_groups.get(Q.id == gid)

    def delete_group(self, gid: str):
        Q = Query()
        self.db_groups.remove(Q.id == gid)

    # ---- characters ----
    def save_character(self, char: dict):
        Q = Query()
        self.db_chars.upsert(char, Q.id == char["id"])

    def get_characters(self) -> list[dict]:
        return self.db_chars.all()

    def get_character(self, cid: str) -> dict | None:
        Q = Query()
        return self.db_chars.get(Q.id == cid)

    def delete_character(self, cid: str):
        Q = Query()
        self.db_chars.remove(Q.id == cid)

# ---- formulas ----
    def save_formulas(self, char: dict):
        Q = Query()
        self.db_formulas.upsert(char, Q.id == char["id"])

    def get_formulas(self) -> list[dict]:
        return self.db_formulas.all()

    def get_formula(self, cid: str) -> dict | None:
        Q = Query()
        return self.db_formulas.get(Q.id == cid)

    def delete_formulas(self, cid: str):
        Q = Query()
        self.db_formulas.remove(Q.id == cid)

# ---- skills ----
    def save_skills(self, char: dict):
        Q = Query()
        self.db_skills.upsert(char, Q.id == char["id"])

    def get_skills(self) -> list[dict]:
        return self.db_skills.all()

    def get_skill(self, cid: str) -> dict | None:
        Q = Query()
        return self.db_skills.get(Q.id == cid)

    def delete_skills(self, cid: str):
        Q = Query()
        self.db_skills.remove(Q.id == cid)
