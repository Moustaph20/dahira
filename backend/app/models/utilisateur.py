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


class Utilisateur(Base):
    __tablename__ = "utilisateurs"

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
        unique=True,
    )

    identifiant: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True,
    )

    mot_de_passe_hash: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    premiere_connexion: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )

    actif: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )

    dernier_acces: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    # ============================================================
    # MEMBRE
    # ============================================================

    membre = relationship(
        "Membre",
        back_populates="utilisateur",
    )

    # ============================================================
    # FONCTIONS
    # ============================================================

    fonctions = relationship(
        "UtilisateurFonction",
        back_populates="utilisateur",
        cascade="all, delete-orphan",
    )

    # ============================================================
    # NOTIFICATIONS
    # ============================================================

    notifications = relationship(
        "Notification",
        back_populates="utilisateur",
        cascade="all, delete-orphan",
        order_by="Notification.created_at.desc()",
    )