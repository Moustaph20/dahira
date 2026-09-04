from sqlalchemy import (
    BigInteger,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.core.database import Base


class UtilisateurFonction(Base):
    __tablename__ = "utilisateur_fonctions"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    utilisateur_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "utilisateurs.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    fonction_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "fonctions.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "utilisateur_id",
            "fonction_id",
            name="uq_utilisateur_fonction",
        ),
    )

    utilisateur = relationship(
        "Utilisateur",
        back_populates="fonctions",
    )

    fonction = relationship(
        "Fonction",
        back_populates="utilisateurs",
    )