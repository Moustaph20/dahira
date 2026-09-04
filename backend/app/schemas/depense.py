from datetime import date
from decimal import Decimal
from enum import Enum

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


# ============================================================
# TYPE DE SORTIE
# ============================================================

class TypeSortie(str, Enum):
    DEPENSE_SOCIALE = "DEPENSE_SOCIALE"
    LOCATION_MATERIEL = "LOCATION_MATERIEL"
    AUTRE = "AUTRE"


# ============================================================
# RÉPONSE
# ============================================================

class DepenseResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True
    )

    id: int

    motif: str

    type_sortie: TypeSortie

    remis_a: str

    montant: Decimal

    date_depense: date

    description: str | None = None

    piece_jointe_nom: str | None = None

    piece_jointe_path: str | None = None

    actif: bool


# ============================================================
# MODIFICATION
# ============================================================

class DepenseUpdate(BaseModel):

    motif: str | None = Field(
        default=None,
        max_length=255,
    )

    type_sortie: TypeSortie | None = None

    remis_a: str | None = Field(
        default=None,
        max_length=255,
    )

    montant: Decimal | None = Field(
        default=None,
        gt=0,
    )

    date_depense: date | None = None

    description: str | None = None