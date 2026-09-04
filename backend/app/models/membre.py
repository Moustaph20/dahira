from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Numeric,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Membre(Base):
    __tablename__ = "membres"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    nom: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    prenom: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    telephone: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        unique=True,
    )

    lieu_residence: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    montant_cotisation: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
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

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    # ============================================================
    # UTILISATEUR
    # ============================================================

    utilisateur = relationship(
        "Utilisateur",
        back_populates="membre",
        uselist=False,
        cascade="all, delete-orphan",
    )

    # ============================================================
    # FONCTIONS
    # ============================================================

    fonctions = relationship(
        "MembreFonction",
        back_populates="membre",
        cascade="all, delete-orphan",
    )

    # ============================================================
    # KOURELS
    # ============================================================

    kourel_affiliations = relationship(
        "KourelMembre",
        back_populates="membre",
        cascade="all, delete-orphan",
    )

    # ============================================================
    # KOURELS DONT CE MEMBRE EST GESTIONNAIRE
    # ============================================================

    kourels_geres = relationship(
        "Kourel",
        back_populates="gestionnaire",
        foreign_keys="Kourel.gestionnaire_membre_id",
    )

    # ============================================================
    # COTISATIONS
    # ============================================================

    cotisations = relationship(
        "Cotisation",
        back_populates="membre",
        cascade="all, delete-orphan",
    )

    # ============================================================
    # PAIEMENTS
    # ============================================================

    paiements = relationship(
        "Paiement",
        back_populates="membre",
        cascade="all, delete-orphan",
    )