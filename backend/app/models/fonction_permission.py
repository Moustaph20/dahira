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


class FonctionPermission(Base):
    __tablename__ = "fonction_permissions"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    fonction_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "fonctions.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    permission_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "permissions.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "fonction_id",
            "permission_id",
            name="uq_fonction_permission",
        ),
    )

    fonction = relationship(
        "Fonction",
        back_populates="permissions",
    )

    permission = relationship(
        "Permission",
        back_populates="fonctions",
    )