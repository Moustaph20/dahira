from sqlalchemy import (
    BigInteger,
    ForeignKey,
    Integer,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.core.database import Base


class DeclamationKhassida(Base):
    __tablename__ = "declamation_khassidas"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    declamation_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "declamations.id",
            ondelete="CASCADE",
        ),
        nullable=False,
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
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    ordre: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
        server_default="1",
    )

    declamation: Mapped["Declamation"] = relationship(
        "Declamation",
        back_populates="khassidas",
    )

    khassida: Mapped["Khassida"] = relationship(
        "Khassida",
        back_populates="declamations",
    )

    ton: Mapped["Ton"] = relationship(
        "Ton",
        back_populates="declamations",
    )