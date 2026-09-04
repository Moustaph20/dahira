from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# ============================================================
# MOT DE PASSE
# ============================================================

def verifier_mot_de_passe(
    mot_de_passe: str,
    mot_de_passe_hash: str
) -> bool:
    return pwd_context.verify(
        mot_de_passe,
        mot_de_passe_hash
    )


def hasher_mot_de_passe(
    mot_de_passe: str
) -> str:
    return pwd_context.hash(
        mot_de_passe
    )


# Alias pour compatibilité avec le code existant
def hash_mot_de_passe(
    mot_de_passe: str
) -> str:
    return hasher_mot_de_passe(
        mot_de_passe
    )


# ============================================================
# JWT
# ============================================================

def creer_access_token(
    utilisateur_id: int,
    fonction_ids: list[int]
) -> str:

    expiration = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )

    payload = {
        "sub": str(utilisateur_id),
        "fonction_ids": fonction_ids,
        "exp": expiration
    }

    return jwt.encode(
        payload,
        settings.secret_key,
        algorithm=settings.algorithm
    )