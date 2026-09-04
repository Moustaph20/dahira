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


class Cotisation(Base):
    __tablename__ = "cotisations"

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

    montant: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    montant_du: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    mois_concerne: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    annee: Mapped[int] = mapped_column(
        nullable=False,
    )

    date_cotisation: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        default=date.today,
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
        back_populates="cotisations",
    )

    paiements = relationship(
        "Paiement",
        back_populates="cotisation",
        cascade="all, delete-orphan",
    )