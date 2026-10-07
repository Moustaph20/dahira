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

    # Le texte devient optionnel.
    # Une communication peut être vocale uniquement.
    contenu: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # URL du message vocal hébergé sur Cloudinary.
    audio_url: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
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

    date_publication: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )

    date_expiration: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    statut: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="PUBLIEE",
        server_default="PUBLIEE",
    )

    actif: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )

    push_envoye: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

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