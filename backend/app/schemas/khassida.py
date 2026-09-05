from pydantic import BaseModel, ConfigDict, Field

from app.schemas.ton import TonResponse


# ============================================================
# AUDIO
# ============================================================

class AudioResponse(BaseModel):

    id: int
    titre: str
    fichier: str
    description: str | None = None
    actif: bool

    ton: TonResponse

    model_config = ConfigDict(
        from_attributes=True
    )


# ============================================================
# BASE KHASSIDA
# ============================================================

class KhassidaBase(BaseModel):

    titre: str = Field(
        ...,
        min_length=2,
        max_length=255
    )

    auteur: str | None = Field(
        default=None,
        max_length=255
    )

    description: str | None = None


# ============================================================
# CRÉATION
# ============================================================

class KhassidaCreate(KhassidaBase):
    pass


# ============================================================
# MODIFICATION
# ============================================================

class KhassidaUpdate(BaseModel):

    titre: str | None = Field(
        default=None,
        min_length=2,
        max_length=255
    )

    auteur: str | None = Field(
        default=None,
        max_length=255
    )

    description: str | None = None


# ============================================================
# RÉPONSE
# ============================================================

class KhassidaResponse(KhassidaBase):

    id: int
    actif: bool

    audios: list[AudioResponse] = []

    model_config = ConfigDict(
        from_attributes=True
    )