import firebase_admin
from firebase_admin import credentials

from app.core.config import settings


def initialiser_firebase():
    """
    Initialise Firebase Admin SDK une seule fois.
    """

    if firebase_admin._apps:
        return firebase_admin.get_app()

    cred = credentials.Certificate(
        settings.firebase_credentials_path
    )

    return firebase_admin.initialize_app(cred)