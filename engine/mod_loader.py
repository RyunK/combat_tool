"""
mods/ 아래의 각 '모드팩' 폴더를 스캔해서 formulas/*.json, skills/*.json 을 로드한다.

모드팩 구조 예:
mods/
  core/
    manifest.json          (선택, 이름/버전/작성자 표기용)
    formulas/*.json
    skills/*.json
  내가_만든_모드팩/
    formulas/*.json
    skills/*.json

새 스킬이나 공식을 추가하고 싶으면 이 구조 그대로 폴더에 json 파일만 추가하면 된다.
공유하고 싶으면 mods/ 안의 폴더 하나를 통째로 복사해서 넘기면 됨.
"""
from __future__ import annotations

import json
from pathlib import Path


def load_mods(mods_dir: str = "mods") -> tuple[dict, dict, list[dict]]:
    """
    반환값: (formulas_by_id, skills_by_id, manifests)
    같은 id 가 여러 모드팩에 있으면 나중에 로드된 것이 덮어씀 (경고 없이 override).
    """
    formulas: dict[str, dict] = {}
    skills: dict[str, dict] = {}
    manifests: list[dict] = []

    mods_path = Path(mods_dir)
    if not mods_path.exists():
        return formulas, skills, manifests

    for pack_dir in sorted(mods_path.iterdir()):
        if not pack_dir.is_dir():
            continue

        manifest_file = pack_dir / "manifest.json"
        if manifest_file.exists():
            try:
                manifest = json.loads(manifest_file.read_text(encoding="utf-8"))
                manifest["_pack_dir"] = pack_dir.name
                manifests.append(manifest)
            except json.JSONDecodeError:
                pass

        formulas_dir = pack_dir / "formulas"
        if formulas_dir.exists():
            for f in sorted(formulas_dir.glob("*.json")):
                data = json.loads(f.read_text(encoding="utf-8"))
                data["_pack"] = pack_dir.name
                formulas[data["id"]] = data

        skills_dir = pack_dir / "skills"
        if skills_dir.exists():
            for f in sorted(skills_dir.glob("*.json")):
                data = json.loads(f.read_text(encoding="utf-8"))
                data["_pack"] = pack_dir.name
                skills[data["id"]] = data

    return formulas, skills, manifests
