from datetime import datetime

from pydantic import BaseModel, ConfigDict


# ============================================================
# CRÉATION
# ============================================================

class NotificationCreate(BaseModel):
    utilisateur_id: int

    titre: str

    message: str

    type: str = "INFO"

    route: str | None = None


# ============================================================
# RÉPONSE
# ============================================================

class NotificationResponse(BaseModel):
    id: int

    utilisateur_id: int

    titre: str

    message: str

    type: str

    route: str | None

    lu: bool

    date_lecture: datetime | None

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


# ============================================================
# COMPTEUR
# ============================================================

class NotificationCountResponse(BaseModel):
    total: int

    non_lues: int