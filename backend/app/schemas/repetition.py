from datetime import date, time

from pydantic import BaseModel, ConfigDict, Field


# ============================================================
# CRÉATION
# ============================================================

class RepetitionCreate(BaseModel):

    programme_id: int

    date_repetition: date

    heure_debut: time | None = None

    heure_fin: time | None = None

    lieu: str | None = Field(
        default=None,
        max_length=200
    )


# ============================================================
# MODIFICATION
# ============================================================

class RepetitionUpdate(BaseModel):

    date_repetition: date | None = None

    heure_debut: time | None = None

    heure_fin: time | None = None

    lieu: str | None = Field(
        default=None,
        max_length=200
    )


# ============================================================
# RÉPONSE SIMPLE
# ============================================================

class RepetitionResponse(BaseModel):

    id: int

    programme_id: int

    date_repetition: date

    heure_debut: time | None

    heure_fin: time | None

    lieu: str | None

    actif: bool

    model_config = ConfigDict(
        from_attributes=True
    )