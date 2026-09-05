from pydantic import BaseModel, ConfigDict, Field


# ============================================================
# BASE
# ============================================================

class TonBase(BaseModel):
    nom: str = Field(
        ...,
        min_length=2,
        max_length=150,
    )

    description: str | None = Field(
        default=None,
        max_length=255,
    )


# ============================================================
# CRÉATION
# ============================================================

class TonCreate(TonBase):
    pass


# ============================================================
# MODIFICATION
# ============================================================

class TonUpdate(BaseModel):
    nom: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    description: str | None = Field(
        default=None,
        max_length=255,
    )


# ============================================================
# RÉPONSE
# ============================================================

class TonResponse(TonBase):
    id: int
    actif: bool

    model_config = ConfigDict(
        from_attributes=True,
    )