from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class GalerieBase(BaseModel):
    titre: str = Field(
        ...,
        min_length=2,
        max_length=255,
    )

    description: str | None = None

    ordre: int = Field(
        default=0,
        ge=0,
    )

    actif: bool = True


class GalerieResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    titre: str
    description: str | None
    type_media: str
    nom_fichier: str
    url: str
    ordre: int
    actif: bool
    created_at: datetime
    updated_at: datetime


class GalerieOrdreUpdate(BaseModel):
    ordre: int = Field(
        ...,
        ge=0,
    )