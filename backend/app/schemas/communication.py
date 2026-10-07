from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)


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
# BASE
# ============================================================

class CommunicationBase(BaseModel):

    titre: str = Field(
        ...,
        min_length=1,
        max_length=200,
    )

    # OPTIONNEL
    contenu: str | None = Field(
        default=None,
    )

    # OPTIONNEL
    audio_url: str | None = Field(
        default=None,
    )

    type_communication: str = "ANNONCE"

    priorite: str = "NORMALE"

    date_publication: datetime | None = None

    date_expiration: datetime | None = None

    statut: str | None = None

    actif: bool = True

    # --------------------------------------------------------
    # TITRE
    # --------------------------------------------------------

    @field_validator("titre")
    @classmethod
    def valider_titre(cls, value: str) -> str:

        value = value.strip()

        if not value:
            raise ValueError(
                "Le titre de la communication est obligatoire."
            )

        return value

    # --------------------------------------------------------
    # CONTENU
    # --------------------------------------------------------

    @field_validator("contenu")
    @classmethod
    def valider_contenu(
        cls,
        value: str | None,
    ) -> str | None:

        if value is None:
            return None

        value = value.strip()

        return value or None

    # --------------------------------------------------------
    # TYPE
    # --------------------------------------------------------

    @field_validator("type_communication")
    @classmethod
    def valider_type(cls, value: str) -> str:

        value = value.upper().strip()

        if value not in TYPES_COMMUNICATION:
            raise ValueError(
                "Type de communication invalide."
            )

        return value

    # --------------------------------------------------------
    # PRIORITE
    # --------------------------------------------------------

    @field_validator("priorite")
    @classmethod
    def valider_priorite(cls, value: str) -> str:

        value = value.upper().strip()

        if value not in PRIORITES_COMMUNICATION:
            raise ValueError(
                "Priorité de communication invalide."
            )

        return value

    # --------------------------------------------------------
    # STATUT
    # --------------------------------------------------------

    @field_validator("statut")
    @classmethod
    def valider_statut(
        cls,
        value: str | None,
    ) -> str | None:

        if value is None:
            return None

        value = value.upper().strip()

        if value not in STATUTS_COMMUNICATION:
            raise ValueError(
                "Statut de communication invalide."
            )

        return value

    # --------------------------------------------------------
    # REGLE PRINCIPALE
    # --------------------------------------------------------
    # Il faut au minimum :
    #
    # - un texte
    # OU
    # - un message vocal
    #
    # Texte + vocal est également autorisé.
    # --------------------------------------------------------

    @model_validator(mode="after")
    def valider_contenu_ou_audio(self):

        contenu = (
            self.contenu.strip()
            if self.contenu
            else ""
        )

        audio = (
            self.audio_url.strip()
            if self.audio_url
            else ""
        )

        if not contenu and not audio:
            raise ValueError(
                "La communication doit contenir "
                "un message texte ou un message vocal."
            )

        self.contenu = contenu or None
        self.audio_url = audio or None

        return self


# ============================================================
# CREATION
# ============================================================

class CommunicationCreate(CommunicationBase):
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
    )

    audio_url: str | None = Field(
        default=None,
    )

    type_communication: str | None = None

    priorite: str | None = None

    date_publication: datetime | None = None

    date_expiration: datetime | None = None

    statut: str | None = None

    actif: bool | None = None

    # --------------------------------------------------------
    # TITRE
    # --------------------------------------------------------

    @field_validator("titre")
    @classmethod
    def valider_titre(
        cls,
        value: str | None,
    ) -> str | None:

        if value is None:
            return None

        value = value.strip()

        if not value:
            raise ValueError(
                "Le titre de la communication est obligatoire."
            )

        return value

    # --------------------------------------------------------
    # CONTENU
    # --------------------------------------------------------

    @field_validator("contenu")
    @classmethod
    def valider_contenu(
        cls,
        value: str | None,
    ) -> str | None:

        if value is None:
            return None

        value = value.strip()

        return value or None

    # --------------------------------------------------------
    # AUDIO
    # --------------------------------------------------------

    @field_validator("audio_url")
    @classmethod
    def valider_audio_url(
        cls,
        value: str | None,
    ) -> str | None:

        if value is None:
            return None

        value = value.strip()

        return value or None

    # --------------------------------------------------------
    # TYPE
    # --------------------------------------------------------

    @field_validator("type_communication")
    @classmethod
    def valider_type(
        cls,
        value: str | None,
    ) -> str | None:

        if value is None:
            return None

        value = value.upper().strip()

        if value not in TYPES_COMMUNICATION:
            raise ValueError(
                "Type de communication invalide."
            )

        return value

    # --------------------------------------------------------
    # PRIORITE
    # --------------------------------------------------------

    @field_validator("priorite")
    @classmethod
    def valider_priorite(
        cls,
        value: str | None,
    ) -> str | None:

        if value is None:
            return None

        value = value.upper().strip()

        if value not in PRIORITES_COMMUNICATION:
            raise ValueError(
                "Priorité de communication invalide."
            )

        return value

    # --------------------------------------------------------
    # STATUT
    # --------------------------------------------------------

    @field_validator("statut")
    @classmethod
    def valider_statut(
        cls,
        value: str | None,
    ) -> str | None:

        if value is None:
            return None

        value = value.upper().strip()

        if value not in STATUTS_COMMUNICATION:
            raise ValueError(
                "Statut de communication invalide."
            )

        return value


# ============================================================
# REPONSE
# ============================================================

class CommunicationResponse(CommunicationBase):

    id: int

    push_envoye: bool

    created_at: datetime

    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


# ============================================================
# MODIFICATION STATUT
# ============================================================

class CommunicationStatutUpdate(BaseModel):

    actif: bool


# ============================================================
# ANNULATION
# ============================================================

class CommunicationAnnulation(BaseModel):

    statut: str = "ANNULEE"