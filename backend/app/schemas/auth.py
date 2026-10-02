from pydantic import BaseModel, Field


# ============================================================
# CONNEXION
# ============================================================

class LoginRequest(BaseModel):
    identifiant: str
    mot_de_passe: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ============================================================
# MODIFICATION DU MOT DE PASSE
# ============================================================

class ModifierMotDePasseRequest(BaseModel):
    ancien_mot_de_passe: str = Field(
        min_length=1,
        max_length=200,
    )

    nouveau_mot_de_passe: str = Field(
        min_length=6,
        max_length=200,
    )