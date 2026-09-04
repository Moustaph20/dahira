from datetime import date, datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    DateTime,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AideExterieure(Base):
    __tablename__ = "aides_exterieures"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True
    )

    # ========================================================
    # SOURCE DE L'AIDE
    # ========================================================

    source: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    # ========================================================
    # MONTANT
    # ========================================================

    montant: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False
    )

    # ========================================================
    # DESCRIPTION
    # ========================================================

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    # ========================================================
    # DATE
    # ========================================================

    date_aide: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        default=date.today
    )

    # ========================================================
    # STATUT
    # ========================================================

    actif: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True
    )

    # ========================================================
    # DATE DE CRÉATION
    # ========================================================

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )