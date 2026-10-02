from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    creer_access_token,
    verifier_mot_de_passe,
    hasher_mot_de_passe,
)
from app.core.dependencies import get_current_user

from app.models.fonction import Fonction
from app.models.fonction_permission import FonctionPermission
from app.models.permission import Permission
from app.models.utilisateur import Utilisateur
from app.models.utilisateur_fonction import UtilisateurFonction
from app.models.membre import Membre
from app.models.kourel_membre import KourelMembre

from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    ModifierMotDePasseRequest,
)


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
# MODIFIER SON MOT DE PASSE
# ============================================================

@router.put(
    "/modifier-mot-de-passe",
)
def modifier_mot_de_passe(
    data: ModifierMotDePasseRequest,
    current_user: Utilisateur = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Permet à l'utilisateur connecté de modifier
    son propre mot de passe.

    Aucun droit d'administration n'est nécessaire.
    """

    # --------------------------------------------------------
    # Vérifier l'ancien mot de passe
    # --------------------------------------------------------

    ancien_mot_de_passe_correct = (
        verifier_mot_de_passe(
            data.ancien_mot_de_passe,
            current_user.mot_de_passe_hash,
        )
    )

    if not ancien_mot_de_passe_correct:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="L'ancien mot de passe est incorrect.",
        )

    # --------------------------------------------------------
    # Vérifier que le nouveau mot de passe est différent
    # --------------------------------------------------------

    if (
        data.ancien_mot_de_passe
        == data.nouveau_mot_de_passe
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Le nouveau mot de passe doit être "
                "différent de l'ancien."
            ),
        )

    # --------------------------------------------------------
    # Générer le nouveau hash
    # --------------------------------------------------------

    nouveau_hash = hasher_mot_de_passe(
        data.nouveau_mot_de_passe
    )

    # --------------------------------------------------------
    # Enregistrer le nouveau mot de passe
    # --------------------------------------------------------

    current_user.mot_de_passe_hash = nouveau_hash

    # Une fois le mot de passe changé, la première connexion
    # n'est plus considérée comme étant en attente.
    current_user.premiere_connexion = False

    db.commit()

    return {
        "message": "Mot de passe modifié avec succès."
    }


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
    # 5. RÉCUPÉRER LES KOURELS
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

        if affiliations:
            est_membre_kourel = True

        for affiliation in affiliations:

            kourel = affiliation.kourel

            if not kourel:
                continue

            if not kourel.actif:
                continue

            est_gestionnaire = False

            if hasattr(
                affiliation,
                "est_gestionnaire",
            ):
                est_gestionnaire = (
                    affiliation.est_gestionnaire is True
                )

            elif hasattr(
                affiliation,
                "gestionnaire",
            ):
                est_gestionnaire = (
                    affiliation.gestionnaire is True
                )

            if hasattr(
                kourel,
                "gestionnaire_membre_id",
            ):
                if (
                    kourel.gestionnaire_membre_id
                    == membre.id
                ):
                    est_gestionnaire = True

            if hasattr(
                kourel,
                "gestionnaire_id",
            ):
                if (
                    kourel.gestionnaire_id
                    == membre.id
                ):
                    est_gestionnaire = True

            kourels.append({
                "id": kourel.id,
                "nom": kourel.nom,
                "description": kourel.description,
                "date_entree": affiliation.date_entree,
                "gestionnaire": est_gestionnaire,
                "est_gestionnaire": est_gestionnaire,
                "is_gestionnaire": est_gestionnaire,
            })

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
            "description": (
                "Gestion et consultation des membres"
            ),
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
            "description": (
                "Consulter le programme religieux"
            ),
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
            "description": (
                "Consulter les communications"
            ),
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
            "description": (
                "Consulter les notifications"
            ),
            "route": "/notifications",
            "icone": "bell",
            "ordre": 7,
        })

    # ========================================================
    # ESPACE KOUREL
    # ========================================================

    if (
        est_membre_kourel
        and "KOUREL_CONSULTER" in permission_codes
    ):

        espace.append({
            "code": "MON_KOUREL",
            "label": "Mon Kourel",
            "description": (
                "Consulter mon espace Kourel"
            ),
            "route": "/mon-kourel",
            "icone": "users",
            "ordre": 8,
        })

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
    # TRIER
    # ========================================================

    espace.sort(
        key=lambda element: element["ordre"]
    )

    # ========================================================
    # 7. RÉPONSE
    # ========================================================

    return {
        "id": current_user.id,
        "membre_id": current_user.membre_id,
        "identifiant": current_user.identifiant,
        "actif": current_user.actif,
        "premiere_connexion": current_user.premiere_connexion,

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

        "est_membre_kourel": est_membre_kourel,

        "est_gestionnaire_kourel": (
            est_gestionnaire_kourel
        ),

        "gestionnaire_kourel_id": (
            gestionnaire_kourel_id
        ),

        "kourels": kourels,

        "fonctions": [
            {
                "id": fonction.id,
                "nom": fonction.nom,
                "description": fonction.description,
            }
            for fonction in fonctions
        ],

        "permissions": [
            {
                "id": permission.id,
                "code": permission.code,
                "nom": permission.nom,
                "description": permission.description,
            }
            for permission in permissions
        ],

        "espace": espace,
    }