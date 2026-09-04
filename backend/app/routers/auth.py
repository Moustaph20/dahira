from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    creer_access_token,
    verifier_mot_de_passe,
)
from app.core.dependencies import get_current_user

from app.models.fonction import Fonction
from app.models.fonction_permission import FonctionPermission
from app.models.permission import Permission
from app.models.utilisateur import Utilisateur
from app.models.utilisateur_fonction import UtilisateurFonction
from app.models.membre import Membre
from app.models.kourel_membre import KourelMembre

from app.schemas.auth import LoginRequest, TokenResponse


router = APIRouter(
    prefix="/auth",
    tags=["Authentification"],
)


# ============================================================
# CONNEXION
# ============================================================

@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    """
    Authentifie un utilisateur et génère son token JWT.
    """

    # --------------------------------------------------------
    # Rechercher l'utilisateur
    # --------------------------------------------------------

    utilisateur = (
        db.query(Utilisateur)
        .filter(
            Utilisateur.identifiant == data.identifiant,
            Utilisateur.actif.is_(True),
        )
        .first()
    )

    if not utilisateur:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiant ou mot de passe incorrect",
        )

    # --------------------------------------------------------
    # Vérifier le mot de passe
    # --------------------------------------------------------

    if not verifier_mot_de_passe(
        data.mot_de_passe,
        utilisateur.mot_de_passe_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiant ou mot de passe incorrect",
        )

    # --------------------------------------------------------
    # Récupérer les fonctions de l'utilisateur
    # --------------------------------------------------------

    associations = (
        db.query(UtilisateurFonction)
        .filter(
            UtilisateurFonction.utilisateur_id
            == utilisateur.id
        )
        .all()
    )

    if not associations:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Aucune fonction attribuée à cet utilisateur",
        )

    fonction_ids = [
        association.fonction_id
        for association in associations
    ]

    # --------------------------------------------------------
    # Création du token
    # --------------------------------------------------------

    token = creer_access_token(
        utilisateur_id=utilisateur.id,
        fonction_ids=fonction_ids,
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
    )


# ============================================================
# UTILISATEUR CONNECTÉ
# ============================================================

@router.get("/me")
def get_me(
    current_user: Utilisateur = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retourne toutes les informations nécessaires
    au frontend pour construire l'espace utilisateur.

    La réponse contient notamment :

    - informations utilisateur
    - informations membre
    - fonctions
    - permissions cumulées
    - appartenance aux Kourels
    - statut gestionnaire de Kourel
    - espace personnel
    """

    # ========================================================
    # 1. RÉCUPÉRER LE MEMBRE ASSOCIÉ
    # ========================================================

    membre = None

    if current_user.membre_id is not None:
        membre = (
            db.query(Membre)
            .filter(
                Membre.id == current_user.membre_id,
            )
            .first()
        )

    # ========================================================
    # 2. RÉCUPÉRER LES FONCTIONS
    # ========================================================

    associations = (
        db.query(UtilisateurFonction)
        .filter(
            UtilisateurFonction.utilisateur_id
            == current_user.id,
        )
        .all()
    )

    fonction_ids = [
        association.fonction_id
        for association in associations
    ]

    fonctions = []

    if fonction_ids:
        fonctions = (
            db.query(Fonction)
            .filter(
                Fonction.id.in_(fonction_ids),
                Fonction.actif.is_(True),
            )
            .order_by(Fonction.nom)
            .all()
        )

    # ========================================================
    # 3. RÉCUPÉRER LES PERMISSIONS CUMULÉES
    # ========================================================

    permissions = []

    if fonction_ids:
        permissions = (
            db.query(Permission)
            .join(
                FonctionPermission,
                FonctionPermission.permission_id
                == Permission.id,
            )
            .filter(
                FonctionPermission.fonction_id.in_(
                    fonction_ids
                ),
                Permission.actif.is_(True),
            )
            .distinct()
            .order_by(Permission.code)
            .all()
        )

    # ========================================================
    # 4. CODES DES PERMISSIONS
    # ========================================================

    permission_codes = {
        permission.code
        for permission in permissions
    }

    # ========================================================
    # 5. RÉCUPÉRER LES KOURELS DE L'UTILISATEUR
    # ========================================================

    kourels = []

    est_membre_kourel = False

    est_gestionnaire_kourel = False

    gestionnaire_kourel_id = None

    if membre:

        affiliations = (
            db.query(KourelMembre)
            .filter(
                KourelMembre.membre_id == membre.id,
                KourelMembre.actif.is_(True),
            )
            .all()
        )

        # ----------------------------------------------------
        # L'utilisateur est membre d'au moins un Kourel
        # ----------------------------------------------------

        if affiliations:
            est_membre_kourel = True

        # ----------------------------------------------------
        # Parcourir les affiliations
        # ----------------------------------------------------

        for affiliation in affiliations:

            kourel = affiliation.kourel

            if not kourel:
                continue

            if not kourel.actif:
                continue

            # ------------------------------------------------
            # Déterminer si l'utilisateur est gestionnaire
            # ------------------------------------------------

            est_gestionnaire = False

            # On vérifie plusieurs possibilités afin de
            # rester compatible avec les modèles actuels.
            # ------------------------------------------------

            if hasattr(affiliation, "est_gestionnaire"):
                est_gestionnaire = (
                    affiliation.est_gestionnaire is True
                )

            elif hasattr(affiliation, "gestionnaire"):
                est_gestionnaire = (
                    affiliation.gestionnaire is True
                )

            # ------------------------------------------------
            # Si le Kourel possède directement un gestionnaire
            # ------------------------------------------------

            if hasattr(kourel, "gestionnaire_membre_id"):

                if (
                    kourel.gestionnaire_membre_id
                    == membre.id
                ):
                    est_gestionnaire = True

            # ------------------------------------------------
            # Si le Kourel possède un gestionnaire_id
            # ------------------------------------------------

            if hasattr(kourel, "gestionnaire_id"):

                if (
                    kourel.gestionnaire_id
                    == membre.id
                ):
                    est_gestionnaire = True

            # ------------------------------------------------
            # Ajouter le Kourel
            # ------------------------------------------------

            kourels.append({
                "id": kourel.id,
                "nom": kourel.nom,
                "description": kourel.description,
                "date_entree": affiliation.date_entree,

                # Informations utiles au frontend
                "gestionnaire": est_gestionnaire,
                "est_gestionnaire": est_gestionnaire,
                "is_gestionnaire": est_gestionnaire,
            })

            # ------------------------------------------------
            # Si gestionnaire d'au moins un Kourel
            # ------------------------------------------------

            if est_gestionnaire:
                est_gestionnaire_kourel = True

                if gestionnaire_kourel_id is None:
                    gestionnaire_kourel_id = kourel.id

    # ========================================================
    # 6. CONSTRUIRE L'ESPACE UTILISATEUR
    # ========================================================

    espace = []

    # --------------------------------------------------------
    # MEMBRES
    # --------------------------------------------------------

    if "MEMBRE_CONSULTER" in permission_codes:
        espace.append({
            "code": "MEMBRES",
            "label": "Membres",
            "description": "Gestion et consultation des membres",
            "route": "/membres",
            "icone": "users",
            "ordre": 1,
        })

    # --------------------------------------------------------
    # COTISATIONS
    # --------------------------------------------------------

    if "COTISATION_CONSULTER" in permission_codes:
        espace.append({
            "code": "COTISATIONS",
            "label": "Cotisations",
            "description": "Consulter les cotisations",
            "route": "/cotisations",
            "icone": "wallet",
            "ordre": 2,
        })

    # --------------------------------------------------------
    # PAIEMENTS
    # --------------------------------------------------------

    if "PAIEMENT_CONSULTER" in permission_codes:
        espace.append({
            "code": "PAIEMENTS",
            "label": "Paiements",
            "description": "Consulter les paiements",
            "route": "/paiements",
            "icone": "credit-card",
            "ordre": 3,
        })

    # --------------------------------------------------------
    # RÉUNIONS
    # --------------------------------------------------------

    if "REUNION_CONSULTER" in permission_codes:
        espace.append({
            "code": "REUNIONS",
            "label": "Réunions",
            "description": "Consulter les réunions",
            "route": "/reunions",
            "icone": "calendar",
            "ordre": 4,
        })

    # --------------------------------------------------------
    # PROGRAMME RELIGIEUX
    # --------------------------------------------------------

    if (
    est_membre_kourel
    and "KOUREL_CONSULTER" in permission_codes
):
        espace.append({
            "code": "PROGRAMME_RELIGIEUX",
            "label": "Programme religieux",
            "description": "Consulter le programme religieux",
            "route": "/programme-religieux",
            "icone": "book-open",
            "ordre": 5,
        })

    # --------------------------------------------------------
    # COMMUNICATIONS
    # --------------------------------------------------------

    if "COMMUNICATION_CONSULTER" in permission_codes:
        espace.append({
            "code": "COMMUNICATIONS",
            "label": "Communications",
            "description": "Consulter les communications",
            "route": "/communications",
            "icone": "megaphone",
            "ordre": 6,
        })

    # --------------------------------------------------------
    # NOTIFICATIONS
    # --------------------------------------------------------

    if "NOTIFICATION_CONSULTER" in permission_codes:
        espace.append({
            "code": "NOTIFICATIONS",
            "label": "Notifications",
            "description": "Consulter les notifications",
            "route": "/notifications",
            "icone": "bell",
            "ordre": 7,
        })

    # ========================================================
    # ESPACE KOUREL
    # ========================================================
    #
    # IMPORTANT :
    #
    # On utilise les vraies permissions de la base.
    #
    # KOUREL_CONSULTER = accès à l'espace Kourel
    #
    # L'utilisateur doit également être membre d'au moins
    # un Kourel.
    #
    # ========================================================

    if (
        est_membre_kourel
        and "KOUREL_CONSULTER" in permission_codes
    ):

        # ----------------------------------------------------
        # MON KOUREL
        # ----------------------------------------------------

        espace.append({
            "code": "MON_KOUREL",
            "label": "Mon Kourel",
            "description": "Consulter mon espace Kourel",
            "route": "/mon-kourel",
            "icone": "users",
            "ordre": 8,
        })

        # ----------------------------------------------------
        # PROGRAMME DU KOUREL
        # ----------------------------------------------------

        espace.append({
            "code": "PROGRAMME_KOUREL",
            "label": "Programme du Kourel",
            "description": (
                "Consulter le programme de répétition "
                "du Kourel"
            ),
            "route": "/programme-kourel",
            "icone": "calendar",
            "ordre": 9,
        })

        # ----------------------------------------------------
        # RÉPÉTITIONS
        # ----------------------------------------------------

        espace.append({
            "code": "REPETITIONS",
            "label": "Répétitions",
            "description": (
                "Consulter les répétitions du Kourel"
            ),
            "route": "/repetitions",
            "icone": "repeat",
            "ordre": 10,
        })

    # ========================================================
    # KHASSIDAS
    # ========================================================
    #
    # KHASSIDA_CONSULTER est la vraie permission.
    #
    # ========================================================

    if (
    est_membre_kourel
    and "KOUREL_CONSULTER" in permission_codes
):

        espace.append({
            "code": "KHASSIDAS",
            "label": "Khassidas",
            "description": "Consulter les Khassidas",
            "route": "/khassidas",
            "icone": "book-open",
            "ordre": 11,
        })

    # ========================================================
    # AUDIO
    # ========================================================
    #
    # Il n'existe actuellement pas de permission AUDIOS dans
    # la liste connue de ta base.
    #
    # On ne l'ajoute donc pas artificiellement ici.
    #
    # ========================================================

    # ========================================================
    # TRIER L'ESPACE
    # ========================================================

    espace.sort(
        key=lambda element: element["ordre"]
    )

    # ========================================================
    # 7. INFORMATIONS FINALES
    # ========================================================

    return {

        # ----------------------------------------------------
        # UTILISATEUR
        # ----------------------------------------------------

        "id": current_user.id,

        "membre_id": current_user.membre_id,

        "identifiant": current_user.identifiant,

        "actif": current_user.actif,

        "premiere_connexion": current_user.premiere_connexion,

        # ----------------------------------------------------
        # INFORMATIONS DU MEMBRE
        # ----------------------------------------------------

        "nom": (
            membre.nom
            if membre
            else None
        ),

        "prenom": (
            membre.prenom
            if membre
            else None
        ),

        "telephone": (
            membre.telephone
            if membre
            else None
        ),

        "lieu_residence": (
            membre.lieu_residence
            if membre
            else None
        ),

        "montant_cotisation": (
            membre.montant_cotisation
            if membre
            else None
        ),

        # ----------------------------------------------------
        # KOUREL
        # ----------------------------------------------------

        "est_membre_kourel": est_membre_kourel,

        "est_gestionnaire_kourel": (
            est_gestionnaire_kourel
        ),

        "gestionnaire_kourel_id": (
            gestionnaire_kourel_id
        ),

        "kourels": kourels,

        # ----------------------------------------------------
        # FONCTIONS
        # ----------------------------------------------------

        "fonctions": [
            {
                "id": fonction.id,
                "nom": fonction.nom,
                "description": fonction.description,
            }
            for fonction in fonctions
        ],

        # ----------------------------------------------------
        # PERMISSIONS
        # ----------------------------------------------------

        "permissions": [
            {
                "id": permission.id,
                "code": permission.code,
                "nom": permission.nom,
                "description": permission.description,
            }
            for permission in permissions
        ],

        # ----------------------------------------------------
        # ESPACE UTILISATEUR
        # ----------------------------------------------------

        "espace": espace,
    }