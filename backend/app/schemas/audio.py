from pydantic import (
    BaseModel,
    ConfigDict,
)


class AudioResponse(BaseModel):

    id: int

    khassida_id: int

    ton_id: int

    titre: str

    fichier: str

    description: str | None = None

    actif: bool

    model_config = ConfigDict(
        from_attributes=True
    )