from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    # ============================================================
    # DESTINATAIRE
    # ============================================================

    utilisateur_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "utilisateurs.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    # ============================================================
    # CONTENU
    # ============================================================

    titre: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # Exemple :
    # INFO
    # SUCCES
    # AVERTISSEMENT
    # ERREUR
    # COTISATION
    # REUNION
    # KOUREL
    # COMMUNICATION

    type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="INFO",
        server_default="INFO",
    )

    # ============================================================
    # NAVIGATION
    # ============================================================

    route: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    # ============================================================
    # LECTURE
    # ============================================================

    lu: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
        index=True,
    )

    date_lecture: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    # ============================================================
    # DATES
    # ============================================================

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        index=True,
    )

    # ============================================================
    # UTILISATEUR
    # ============================================================

    utilisateur = relationship(
        "Utilisateur",
        back_populates="notifications",
    )