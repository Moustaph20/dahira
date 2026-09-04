from datetime import date, datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.core.database import Base


class KourelMembre(Base):
    __tablename__ = "kourel_membres"

    # ============================================================
    # CONTRAINTE D'UNICITÉ
    # ============================================================

    __table_args__ = (
        UniqueConstraint(
            "kourel_id",
            "membre_id",
            name="uq_kourel_membre",
        ),
    )

    # ============================================================
    # IDENTIFIANT
    # ============================================================

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    # ============================================================
    # KOUREL
    # ============================================================

    kourel_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "kourels.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    # ============================================================
    # MEMBRE
    # ============================================================

    membre_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "membres.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    # ============================================================
    # DATE D'ENTRÉE
    # ============================================================

    date_entree: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        default=date.today,
    )

    # ============================================================
    # DATE DE SORTIE
    # ============================================================

    date_sortie: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    # ============================================================
    # GESTIONNAIRE
    # ============================================================

    gestionnaire: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

    # ============================================================
    # STATUT
    # ============================================================

    actif: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )

    # ============================================================
    # DATES
    # ============================================================

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    # ============================================================
    # RELATION KOUREL
    # ============================================================

    kourel: Mapped["Kourel"] = relationship(
        "Kourel",
        back_populates="membres",
    )

    # ============================================================
    # RELATION MEMBRE
    # ============================================================

    membre: Mapped["Membre"] = relationship(
        "Membre",
        back_populates="kourel_affiliations",
    )