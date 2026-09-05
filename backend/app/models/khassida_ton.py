from sqlalchemy import (
    BigInteger,
    ForeignKey,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.core.database import Base


class KhassidaTon(Base):
    __tablename__ = "khassida_tons"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    khassida_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "khassidas.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    ton_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "tons.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    # ==========================================================
    # RELATION AVEC LA KHASSIDA
    # ==========================================================

    khassida: Mapped["Khassida"] = relationship(
        "Khassida",
        back_populates="khassida_tons",
    )

    # ==========================================================
    # RELATION AVEC LE TON
    # ==========================================================

    ton: Mapped["Ton"] = relationship(
        "Ton",
        back_populates="khassida_tons",
    )