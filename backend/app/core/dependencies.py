from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.utilisateur import Utilisateur


security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> Utilisateur:
    token = credentials.credentials

    # ========================================================
    # VALIDATION DU TOKEN JWT
    # ========================================================

    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm],
        )

        utilisateur_id = payload.get("sub")

        if utilisateur_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token invalide",
            )

        try:
            utilisateur_id = int(utilisateur_id)
        except (TypeError, ValueError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token invalide",
            )

    except HTTPException:
        raise

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré",
        )

    # ========================================================
    # RÉCUPÉRER L'UTILISATEUR
    # ========================================================

    utilisateur = (
        db.query(Utilisateur)
        .filter(
            Utilisateur.id == utilisateur_id,
            Utilisateur.actif.is_(True),
        )
        .first()
    )

    if not utilisateur:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur introuvable ou inactif",
        )

    return utilisateur