from pydantic import BaseModel, ConfigDict, Field


# ============================================================
# BASE
# ============================================================

class FonctionBase(BaseModel):
    nom: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    description: str | None = Field(
        default=None,
        max_length=255,
    )


# ============================================================
# CRÉATION
# ============================================================

class FonctionCreate(FonctionBase):
    pass


# ============================================================
# MODIFICATION
# ============================================================

class FonctionUpdate(BaseModel):
    nom: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    description: str | None = Field(
        default=None,
        max_length=255,
    )


# ============================================================
# RÉPONSE
# ============================================================

class FonctionResponse(FonctionBase):
    id: int
    actif: bool

    model_config = ConfigDict(
        from_attributes=True
    )