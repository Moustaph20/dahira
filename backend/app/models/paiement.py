from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Numeric,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Paiement(Base):
    __tablename__ = "paiements"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    membre_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "membres.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    cotisation_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "cotisations.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    montant: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    mode_paiement: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    date_paiement: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        default=date.today,
    )

    reference: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    actif: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    membre = relationship(
        "Membre",
        back_populates="paiements",
    )

    cotisation = relationship(
        "Cotisation",
        back_populates="paiements",
    )