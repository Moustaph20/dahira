from fastapi import FastAPI

# ============================================================
# ROUTERS
# ============================================================

from app.routers.auth import router as auth_router
from app.routers.membres import router as membres_router

from app.routers import (
    cotisations,
    paiements,
    dashboard,
    reunions,
    communications,
    programmes,
    choix_khassidas,
    audios,
    fonctions,
    kourels,
    depenses,
    aides_exterieures,
    tons,
)

from app.routers.utilisateurs import router as utilisateurs_router
from app.routers.khassidas import router as khassidas_router
from app.routers.repetitions import router as repetitions_router
from app.routers.programmes_religieux import (
    router as programmes_religieux_router,
)
from app.routers.notifications import (
    router as notifications_router,
)
from app.routers.galerie import (
    router as galerie_router,
)


# ============================================================
# APPLICATION
# ============================================================

app = FastAPI(
    title="Dahira API",
    version="1.0.0",
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

# ============================================================
# TONS
# ============================================================

app.include_router(tons.router)

app.include_router(repetitions_router)

app.include_router(programmes_religieux_router)

app.include_router(depenses.router)

app.include_router(aides_exterieures.router)

app.include_router(notifications_router)

app.include_router(galerie_router)


# ============================================================
# ROUTE RACINE
# ============================================================

@app.get("/")
def root():
    return {
        "message": "API Dahira opérationnelle.",
        "version": "1.0.0",
    }