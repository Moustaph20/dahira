from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


# ============================================================
# KOUREL
# ============================================================

class KourelBase(BaseModel):
    nom: str = Field(
        ...,
        min_length=2,
        max_length=150,
    )

    description: str | None = None

    actif: bool = True


class KourelCreate(KourelBase):
    pass


class KourelUpdate(BaseModel):
    nom: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    description: str | None = None

    actif: bool | None = None


# ============================================================
# AJOUTER UN MEMBRE AU KOUREL
# ============================================================

class KourelMembreCreate(BaseModel):
    membre_id: int
    date_entree: date | None = None


# ============================================================
# COMPATIBILITÉ AVEC L'ANCIEN NOM
# ============================================================
#
# Certains routeurs utilisent encore :
#
#     AjouterMembreKourel
#
# On conserve donc cet alias pour éviter les ImportError.
#

AjouterMembreKourel = KourelMembreCreate


# ============================================================
# RÉPONSE D'UNE AFFILIATION KOUREL / MEMBRE
# ============================================================

class KourelMembreResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True
    )

    id: int

    kourel_id: int

    membre_id: int

    date_entree: date

    date_sortie: date | None = None

    actif: bool

    # --------------------------------------------------------
    # Informations du membre
    # --------------------------------------------------------

    nom: str

    prenom: str

    telephone: str | None = None

    lieu_residence: str | None = None

    montant_cotisation: float | None = None


# ============================================================
# RÉPONSE KOUREL
# ============================================================

class KourelResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True
    )

    id: int

    nom: str

    description: str | None = None

    actif: bool

    gestionnaire_membre_id: int | None = None

    created_at: datetime

    updated_at: datetime


# ============================================================
# DÉTAIL D'UN KOUREL
# ============================================================

class KourelDetailResponse(KourelResponse):

    membres: list[KourelMembreResponse] = Field(
        default_factory=list
    )