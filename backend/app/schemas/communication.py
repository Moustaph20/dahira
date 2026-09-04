
# app/schemas/communication.py

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


# ============================================================
# VALEURS AUTORISÉES
# ============================================================

TYPES_COMMUNICATION = {
    "ANNONCE",
    "REUNION",
    "PROGRAMME_RELIGIEUX",
    "KOUREL",
    "RAPPEL",
    "URGENT",
    "AUTRE",
}

PRIORITES_COMMUNICATION = {
    "NORMALE",
    "IMPORTANTE",
    "URGENTE",
}


# ============================================================
# SCHEMA DE BASE
# ============================================================

class CommunicationBase(BaseModel):
    titre: str = Field(
        ...,
        min_length=2,
        max_length=200,
    )

    contenu: str = Field(
        ...,
        min_length=1,
    )

    type_communication: str = Field(
        default="ANNONCE",
        max_length=50,
    )

    priorite: str = Field(
        default="NORMALE",
        max_length=30,
    )

    date_publication: datetime | None = None

    date_expiration: datetime | None = None

    actif: bool = True

    @field_validator("titre")
    @classmethod
    def valider_titre(cls, value: str) -> str:
        value = value.strip()

        if len(value) < 2:
            raise ValueError(
                "Le titre doit contenir au moins 2 caractères."
            )

        return value

    @field_validator("contenu")
    @classmethod
    def valider_contenu(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError(
                "Le contenu de la communication est obligatoire."
            )

        return value

    @field_validator("type_communication")
    @classmethod
    def valider_type(cls, value: str) -> str:
        value = value.strip().upper()

        if value not in TYPES_COMMUNICATION:
            raise ValueError(
                "Type de communication invalide. "
                f"Valeurs autorisées : {', '.join(sorted(TYPES_COMMUNICATION))}."
            )

        return value

    @field_validator("priorite")
    @classmethod
    def valider_priorite(cls, value: str) -> str:
        value = value.strip().upper()

        if value not in PRIORITES_COMMUNICATION:
            raise ValueError(
                "Priorité invalide. "
                f"Valeurs autorisées : {', '.join(sorted(PRIORITES_COMMUNICATION))}."
            )

        return value

    @field_validator("date_expiration")
    @classmethod
    def valider_date_expiration(
        cls,
        value: datetime | None,
    ) -> datetime | None:
        return value


# ============================================================
# CREATION
# ============================================================

class CommunicationCreate(CommunicationBase):
    """
    Données nécessaires à la création d'une communication.
    """

    date_publication: datetime | None = None
    date_expiration: datetime | None = None
    actif: bool = True


# ============================================================
# MODIFICATION
# ============================================================

class CommunicationUpdate(BaseModel):
    """
    Tous les champs sont facultatifs lors d'une modification.
    """

    titre: str | None = Field(
        default=None,
        min_length=2,
        max_length=200,
    )

    contenu: str | None = Field(
        default=None,
        min_length=1,
    )

    type_communication: str | None = Field(
        default=None,
        max_length=50,
    )

    priorite: str | None = Field(
        default=None,
        max_length=30,
    )

    date_publication: datetime | None = None

    date_expiration: datetime | None = None

    actif: bool | None = None

    @field_validator("titre")
    @classmethod
    def valider_titre(cls, value: str | None) -> str | None:
        if value is None:
            return None

        value = value.strip()

        if len(value) < 2:
            raise ValueError(
                "Le titre doit contenir au moins 2 caractères."
            )

        return value

    @field_validator("contenu")
    @classmethod
    def valider_contenu(cls, value: str | None) -> str | None:
        if value is None:
            return None

        value = value.strip()

        if not value:
            raise ValueError(
                "Le contenu de la communication est obligatoire."
            )

        return value

    @field_validator("type_communication")
    @classmethod
    def valider_type(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        value = value.strip().upper()

        if value not in TYPES_COMMUNICATION:
            raise ValueError(
                "Type de communication invalide. "
                f"Valeurs autorisées : {', '.join(sorted(TYPES_COMMUNICATION))}."
            )

        return value

    @field_validator("priorite")
    @classmethod
    def valider_priorite(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        value = value.strip().upper()

        if value not in PRIORITES_COMMUNICATION:
            raise ValueError(
                "Priorité invalide. "
                f"Valeurs autorisées : {', '.join(sorted(PRIORITES_COMMUNICATION))}."
            )

        return value


# ============================================================
# REPONSE API
# ============================================================

class CommunicationResponse(CommunicationBase):
    """
    Structure renvoyée par l'API.
    """

    id: int

    created_at: datetime

    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


# ============================================================
# ACTIVATION / DESACTIVATION
# ============================================================

class CommunicationStatutUpdate(BaseModel):
    """
    Permet d'activer ou de désactiver une communication.
    """

    actif: bool
