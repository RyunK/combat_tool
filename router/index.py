from fastapi import APIRouter, Request

from engine.mod_loader import load_mods
from .deps import storage, templates

router = APIRouter(tags=["dashboard"])


@router.get("/")
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
