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

STATUTS_COMMUNICATION = {
    "BROUILLON",
    "PROGRAMMEE",
    "PUBLIEE",
    "EXPIREE",
    "ANNULEE",
}


# ============================================================
# SCHÉMA DE BASE
# ============================================================

class CommunicationBase(BaseModel):
    titre: str = Field(
        ...,
        min_length=1,
        max_length=200,
    )

    contenu: str = Field(
        ...,
        min_length=1,
    )

    type_communication: str = "ANNONCE"

    priorite: str = "NORMALE"

    # ========================================================
    # DATE DE PUBLICATION
    # ========================================================
    #
    # - publication immédiate : maintenant
    # - programmation : date/heure future
    #
    date_publication: datetime | None = None

    date_publication: datetime | None = None

    # ========================================================
    # DATE D'EXPIRATION
    # ========================================================

    date_expiration: datetime | None = None

    # ========================================================
    # STATUT
    # ========================================================

    statut: str | None = None

    # ========================================================
    # ACTIVITÉ
    # ========================================================

    actif: bool = True

    # ========================================================
    # VALIDATIONS
    # ========================================================

    @field_validator("titre")
    @classmethod
    def valider_titre(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError(
                "Le titre de la communication est obligatoire."
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
        value = value.upper().strip()

        if value not in TYPES_COMMUNICATION:
            raise ValueError(
                "Type de communication invalide."
            )

        return value

    @field_validator("priorite")
    @classmethod
    def valider_priorite(cls, value: str) -> str:
        value = value.upper().strip()

        if value not in PRIORITES_COMMUNICATION:
            raise ValueError(
                "Priorité de communication invalide."
            )

        return value

    @field_validator("statut")
    @classmethod
    def valider_statut(cls, value: str | None) -> str | None:
        if value is None:
            return None

        value = value.upper().strip()

        if value not in STATUTS_COMMUNICATION:
            raise ValueError(
                "Statut de communication invalide."
            )

        return value


# ============================================================
# CRÉATION
# ============================================================

class CommunicationCreate(CommunicationBase):
    """
    Création d'une communication.

    Le statut est normalement déterminé automatiquement par
    le backend selon la date de publication.

    Le frontend pourra également utiliser explicitement :
        - BROUILLON
        - PROGRAMMEE
        - PUBLIEE
    """

    pass


# ============================================================
# MODIFICATION
# ============================================================

class CommunicationUpdate(BaseModel):
    titre: str | None = Field(
        default=None,
        min_length=1,
        max_length=200,
    )

    contenu: str | None = Field(
        default=None,
        min_length=1,
    )

    type_communication: str | None = None

    priorite: str | None = None

    date_publication: datetime | None = None

    date_expiration: datetime | None = None

    statut: str | None = None

    actif: bool | None = None

    @field_validator("titre")
    @classmethod
    def valider_titre(cls, value: str | None) -> str | None:
        if value is None:
            return None

        value = value.strip()

        if not value:
            raise ValueError(
                "Le titre de la communication est obligatoire."
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
    def valider_type(cls, value: str | None) -> str | None:
        if value is None:
            return None

        value = value.upper().strip()

        if value not in TYPES_COMMUNICATION:
            raise ValueError(
                "Type de communication invalide."
            )

        return value

    @field_validator("priorite")
    @classmethod
    def valider_priorite(cls, value: str | None) -> str | None:
        if value is None:
            return None

        value = value.upper().strip()

        if value not in PRIORITES_COMMUNICATION:
            raise ValueError(
                "Priorité de communication invalide."
            )

        return value

    @field_validator("statut")
    @classmethod
    def valider_statut(cls, value: str | None) -> str | None:
        if value is None:
            return None

        value = value.upper().strip()

        if value not in STATUTS_COMMUNICATION:
            raise ValueError(
                "Statut de communication invalide."
            )

        return value


# ============================================================
# RÉPONSE
# ============================================================

class CommunicationResponse(
    CommunicationBase
):
    id: int

    push_envoye: bool

    created_at: datetime

    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


# ============================================================
# MODIFICATION DU STATUT ACTIF
# ============================================================

class CommunicationStatutUpdate(BaseModel):
    actif: bool


# ============================================================
# ANNULATION D'UNE COMMUNICATION PROGRAMMÉE
# ============================================================

class CommunicationAnnulation(BaseModel):
    statut: str = "ANNULEE"