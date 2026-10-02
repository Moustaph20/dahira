from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    identifiant: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )

    mot_de_passe: str = Field(
        ...,
        min_length=1,
        max_length=200,
    )


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ModifierMotDePasseRequest(BaseModel):
    ancien_mot_de_passe: str = Field(
        min_length=1,
        max_length=200,
    )

    nouveau_mot_de_passe: str = Field(
        min_length=6,
        max_length=200,
    )