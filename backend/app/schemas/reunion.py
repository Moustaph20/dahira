from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


TYPES_REUNION = {
    "MENSUELLE",
    "EXTRAORDINAIRE",
    "BUREAU",
    "KOUREL",
    "AUTRE",
}

STATUTS_REUNION = {
    "PROGRAMMEE",
    "EN_COURS",
    "TERMINEE",
    "ANNULEE",
}


class ReunionCreate(BaseModel):
    titre: str = Field(..., min_length=2, max_length=150)
    type_reunion: str = Field(default="MENSUELLE", max_length=30)
    description: str | None = None
    ordre_du_jour: str | None = None
    date_reunion: datetime
    lieu: str = Field(..., min_length=2, max_length=200)
    adresse: str | None = Field(default=None, max_length=300)
    latitude: float | None = None
    longitude: float | None = None
    statut: str = Field(default="PROGRAMMEE", max_length=30)
    compte_rendu: str | None = None

    @field_validator("type_reunion")
    @classmethod
    def valider_type(cls, value):
        value = value.upper().strip()

        if value not in TYPES_REUNION:
            raise ValueError(
                "Type de réunion invalide."
            )

        return value

    @field_validator("statut")
    @classmethod
    def valider_statut(cls, value):
        value = value.upper().strip()

        if value not in STATUTS_REUNION:
            raise ValueError(
                "Statut de réunion invalide."
            )

        return value

    @field_validator("latitude")
    @classmethod
    def valider_latitude(cls, value):
        if value is None:
            return value

        if value < -90 or value > 90:
            raise ValueError(
                "La latitude doit être comprise entre -90 et 90."
            )

        return value

    @field_validator("longitude")
    @classmethod
    def valider_longitude(cls, value):
        if value is None:
            return value

        if value < -180 or value > 180:
            raise ValueError(
                "La longitude doit être comprise entre -180 et 180."
            )

        return value


class ReunionUpdate(ReunionCreate):
    pass


class ReunionCompteRenduUpdate(BaseModel):
    compte_rendu: str | None = None


class ReunionStatutUpdate(BaseModel):
    statut: str = Field(..., max_length=30)

    @field_validator("statut")
    @classmethod
    def valider_statut(cls, value):
        value = value.upper().strip()

        if value not in STATUTS_REUNION:
            raise ValueError(
                "Statut de réunion invalide."
            )

        return value


class GoogleMapsLocalisationRequest(BaseModel):
    lien: str = Field(
        ...,
        min_length=10,
        max_length=2048,
    )


class GoogleMapsLocalisationResponse(BaseModel):
    latitude: float
    longitude: float
    lien: str
    source: str = "google_maps"


class ReunionResponse(BaseModel):
    id: int
    titre: str
    type_reunion: str
    description: str | None
    ordre_du_jour: str | None
    date_reunion: datetime
    lieu: str
    adresse: str | None
    latitude: float | None
    longitude: float | None
    statut: str
    compte_rendu: str | None
    actif: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )