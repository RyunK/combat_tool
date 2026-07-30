from engine.models import Group
from engine.storage import Storage


storage = Storage("data")


def get_groups_by_id() -> dict[str, Group]:
    return {g["id"]: Group(**g) for g in storage.get_groups()}