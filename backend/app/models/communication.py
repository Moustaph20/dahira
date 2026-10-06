from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Communication(Base):
    __tablename__ = "communications"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    titre: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    contenu: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    type_communication: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="ANNONCE",
    )

    priorite: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="NORMALE",
    )

    # ============================================================
    # DATE DE PUBLICATION
    # ============================================================
    #
    # Pour une communication immédiate :
    #   date_publication = maintenant
    #
    # Pour une communication programmée :
    #   date_publication = date/heure choisie
    #
    date_publication: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )

    # ============================================================
    # DATE D'EXPIRATION
    # ============================================================

    date_expiration: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    # ============================================================
    # STATUT
    # ============================================================
    #
    # BROUILLON
    # PROGRAMMEE
    # PUBLIEE
    # EXPIREE
    # ANNULEE
    #
    statut: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="PUBLIEE",
        server_default="PUBLIEE",
    )

    # ============================================================
    # ACTIVATION
    # ============================================================
    #
    # Ce champ est conservé pour rester compatible avec
    # le fonctionnement actuel de l'application.
    #
    actif: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )

    # ============================================================
    # NOTIFICATION FIREBASE
    # ============================================================
    #
    # False = notification pas encore envoyée
    # True  = notification déjà envoyée
    #
    # Cela permet d'éviter qu'une communication programmée
    # envoie plusieurs fois la même notification.
    #
    push_envoye: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

    # ============================================================
    # DATES TECHNIQUES
    # ============================================================

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )