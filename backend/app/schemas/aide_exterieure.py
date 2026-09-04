
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


# ============================================================
# BASE
# ============================================================

class AideExterieureBase(BaseModel):
    source: str = Field(
        ...,
        min_length=2,
        max_length=150
    )

    montant: Decimal = Field(
        ...,
        gt=0
    )

    description: str | None = None

    date_aide: date


# ============================================================
# CRÉATION
# ============================================================

class AideExterieureCreate(AideExterieureBase):
    pass


# ============================================================
# MODIFICATION
# ============================================================

class AideExterieureUpdate(BaseModel):
    source: str | None = Field(
        default=None,
        min_length=2,
        max_length=150
    )

    montant: Decimal | None = Field(
        default=None,
        gt=0
    )

    description: str | None = None

    date_aide: date | None = None

    actif: bool | None = None


# ============================================================
# RÉPONSE
# ============================================================

class AideExterieureResponse(AideExterieureBase):
    id: int
    actif: bool
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )

