from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings


# ============================================================
# MODÈLES
# ============================================================

from app.models.membre import Membre
from app.models.fonction import Fonction
from app.models.utilisateur import Utilisateur
from app.models.permission import Permission
from app.models.fonction_permission import FonctionPermission
from app.models.utilisateur_fonction import UtilisateurFonction
from app.models.galerie import Galerie


# ============================================================
# MODÈLES KOUREL
# ============================================================

from app.models.kourel import Kourel
from app.models.kourel_membre import KourelMembre

from app.models.programme_mensuel import ProgrammeMensuel
from app.models.repetition import Repetition
from app.models.declamation import Declamation
from app.models.declamation_khassida import DeclamationKhassida

from app.models.khassida import Khassida
from app.models.khassida_ton import KhassidaTon

from app.models.ton import Ton
from app.models.audio import Audio

from app.models.repetition_khassida import RepetitionKhassida


# ============================================================
# MODÈLES FINANCES
# ============================================================

from app.models.depense import Depense
from app.models.aide_exterieure import AideExterieure


# ============================================================
# ROUTERS
# ============================================================

from app.routers.auth import router as auth_router
from app.routers.membres import router as membres_router

from app.routers import cotisations
from app.routers import paiements
from app.routers import dashboard
from app.routers import reunions
from app.routers import communications

from app.routers import programmes
from app.routers import choix_khassidas
from app.routers import audios
from app.routers.galerie import router as galerie_router

from app.routers.repetitions import (
    router as repetitions_router
)

from app.routers.utilisateurs import (
    router as utilisateurs_router
)

from app.routers import fonctions
from app.routers import kourels

from app.routers.khassidas import (
    router as khassidas_router
)

from app.routers.programmes_religieux import (
    router as programmes_religieux_router
)

from app.routers.notifications import (
    router as notifications_router
)

from app.routers import depenses
from app.routers import aides_exterieures


# ============================================================
# APPLICATION
# ============================================================

app = FastAPI(
    title="Dahira API",
    description="API de gestion du Dahira",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# UPLOADS
# ============================================================

Path("uploads/audios").mkdir(
    parents=True,
    exist_ok=True,
)

app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads",
)


# ============================================================
# ROUTES
# ============================================================

app.include_router(auth_router)

app.include_router(membres_router)

app.include_router(cotisations.router)

app.include_router(paiements.router)

app.include_router(dashboard.router)

app.include_router(reunions.router)

app.include_router(communications.router)

app.include_router(programmes.router)

app.include_router(choix_khassidas.router)

app.include_router(audios.router)

app.include_router(utilisateurs_router)

app.include_router(fonctions.router)

app.include_router(kourels.router)

app.include_router(khassidas_router)

app.include_router(repetitions_router)

app.include_router(programmes_religieux_router)

app.include_router(depenses.router)

app.include_router(aides_exterieures.router)

app.include_router(notifications_router)

app.include_router(galerie_router)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "Dahira API opérationnelle",
        "version": "1.0.0",
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():
    return {
        "status": "ok",
    }