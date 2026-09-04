from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Galerie(Base):
    __tablename__ = "galeries"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    titre: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    type_media: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )
    # image ou video

    nom_fichier: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    chemin_fichier: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    ordre: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    actif: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
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