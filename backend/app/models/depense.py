from datetime import date, datetime
from decimal import Decimal
import sqlalchemy as sa

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


class Depense(Base):
    __tablename__ = "depenses"

    # ============================================================
    # IDENTIFIANT
    # ============================================================

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    # ============================================================
    # MOTIF
    # ============================================================

    motif: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    # ============================================================
    # TYPE DE SORTIE
    # ============================================================

    type_sortie: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="AUTRE",
        server_default="AUTRE",
    )

    # ============================================================
    # REMIS À
    # ============================================================

    remis_a: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    # ============================================================
    # MONTANT
    # ============================================================

    montant: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    # ============================================================
    # DATE DE LA SORTIE
    # ============================================================

    date_depense: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    # ============================================================
    # DESCRIPTION
    # ============================================================

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # ============================================================
    # PIÈCE JOINTE
    # ============================================================

    piece_jointe_nom: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    piece_jointe_path: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    # ============================================================
    # ACTIVITÉ
    # ============================================================

    actif: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )

    # ============================================================
    # DATE DE CRÉATION
    # ============================================================

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        server_default=sa.text("CURRENT_TIMESTAMP"),
    )