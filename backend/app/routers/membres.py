
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import require_permission
from app.core.security import hasher_mot_de_passe

from app.models.membre import Membre
from app.models.utilisateur import Utilisateur
from app.models.fonction import Fonction
from app.models.utilisateur_fonction import UtilisateurFonction
from app.models.kourel import Kourel
from app.models.kourel_membre import KourelMembre

from app.schemas.membre import MembreCreate, MembreUpdate

from app.services.notification_service import creer_notification


router = APIRouter(
    prefix="/membres",
    tags=["Membres"],
)


# ============================================================
# OUTIL : RÉCUPÉRER LES FONCTIONS D'UN UTILISATEUR
# ============================================================

def recuperer_fonctions_utilisateur(
    utilisateur_id: int,
    db: Session,
):
    return (
        db.query(Fonction)
        .join(
            UtilisateurFonction,
            UtilisateurFonction.fonction_id == Fonction.id,
        )
        .filter(
            UtilisateurFonction.utilisateur_id == utilisateur_id,
            Fonction.actif.is_(True),
        )
        .order_by(Fonction.nom.asc())
        .all()
    )


# ============================================================
# OUTIL : RÉCUPÉRER LES KOURELS D'UN MEMBRE
# ============================================================

def recuperer_kourels_membre(
    membre_id: int,
    db: Session,
):
    return (
        db.query(Kourel)
        .join(
            KourelMembre,
            KourelMembre.kourel_id == Kourel.id,
        )
        .filter(
            KourelMembre.membre_id == membre_id,
            KourelMembre.actif.is_(True),
            Kourel.actif.is_(True),
        )
        .order_by(Kourel.nom.asc())
        .all()
    )


# ============================================================
# CRÉER UN MEMBRE
# + COMPTE UTILISATEUR
# + FONCTIONS
# + KOURELS
# + NOTIFICATION
# ============================================================

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
def creer_membre(
    donnees: MembreCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("MEMBRE_CREER")
    ),
):
    # --------------------------------------------------------
    # 1. Vérifier le téléphone du membre
    # --------------------------------------------------------

    membre_existant = (
        db.query(Membre)
        .filter(
            Membre.telephone == donnees.telephone
        )
        .first()
    )

    if membre_existant:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Un membre avec ce numéro de téléphone existe déjà.",
        )

    # --------------------------------------------------------
    # 2. Vérifier les fonctions
    # --------------------------------------------------------

    fonction_ids = list(
        dict.fromkeys(donnees.fonction_ids)
    )

    fonctions = []

    if fonction_ids:
        fonctions = (
            db.query(Fonction)
            .filter(
                Fonction.id.in_(fonction_ids),
                Fonction.actif.is_(True),
            )
            .all()
        )

        if len(fonctions) != len(fonction_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Une ou plusieurs fonctions sélectionnées sont invalides.",
            )

    # --------------------------------------------------------
    # 3. Vérifier les Kourels
    # --------------------------------------------------------

    kourel_ids = list(
        dict.fromkeys(donnees.kourel_ids)
    )

    kourels = []

    if kourel_ids:
        kourels = (
            db.query(Kourel)
            .filter(
                Kourel.id.in_(kourel_ids),
                Kourel.actif.is_(True),
            )
            .all()
        )

        if len(kourels) != len(kourel_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un ou plusieurs Kourels sélectionnés sont invalides.",
            )

    # --------------------------------------------------------
    # 4. Créer le membre
    # --------------------------------------------------------

    membre = Membre(
        nom=donnees.nom,
        prenom=donnees.prenom,
        telephone=donnees.telephone,
        lieu_residence=donnees.lieu_residence,
        montant_cotisation=donnees.montant_cotisation,
        actif=True,
    )

    try:
        db.add(membre)
        db.flush()

        # ----------------------------------------------------
        # 5. Créer le compte utilisateur
        #
        # Pour un NOUVEAU membre :
        # identifiant initial = téléphone
        # mot de passe initial = téléphone
        #
        # IMPORTANT :
        # cela ne modifie jamais les comptes existants.
        # ----------------------------------------------------

        utilisateur = Utilisateur(
            membre_id=membre.id,
            identifiant=membre.telephone,
            mot_de_passe_hash=hasher_mot_de_passe(
                membre.telephone
            ),
            premiere_connexion=True,
            actif=True,
        )

        db.add(utilisateur)
        db.flush()

        # ----------------------------------------------------
        # 6. Affecter les fonctions
        # ----------------------------------------------------

        for fonction in fonctions:
            db.add(
                UtilisateurFonction(
                    utilisateur_id=utilisateur.id,
                    fonction_id=fonction.id,
                )
            )

        # ----------------------------------------------------
        # 7. Affecter les Kourels
        # ----------------------------------------------------

        for kourel in kourels:
            db.add(
                KourelMembre(
                    kourel_id=kourel.id,
                    membre_id=membre.id,
                    date_entree=date.today(),
                    date_sortie=None,
                    gestionnaire=False,
                    actif=True,
                )
            )

        # ----------------------------------------------------
        # 8. Créer la notification de bienvenue
        # ----------------------------------------------------

        creer_notification(
            db=db,
            utilisateur_id=utilisateur.id,
            titre="Bienvenue dans le Dahira",
            message=(
                f"Bienvenue {membre.prenom} {membre.nom}. "
                "Votre compte a été créé avec succès. "
                "Votre identifiant initial est votre numéro : "
                f"{membre.telephone}. "
                "Vous devrez modifier votre mot de passe "
                "lors de votre première connexion."
            ),
            type="MEMBRE",
            route="/mon-espace",
        )

        # ----------------------------------------------------
        # 9. Valider toute la transaction
        # ----------------------------------------------------

        db.commit()

    except IntegrityError as erreur:
        db.rollback()

        print(
            "ERREUR INTEGRITYERROR CREATION MEMBRE :",
            repr(erreur),
        )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Impossible de créer le membre, son compte, "
                "ses fonctions ou ses affiliations aux Kourels."
            ),
        )

    db.refresh(membre)
    db.refresh(utilisateur)

    # --------------------------------------------------------
    # 10. Réponse
    # --------------------------------------------------------

    return {
        "message": (
            "Membre, compte utilisateur, fonctions et "
            "affiliations créés avec succès"
        ),
        "membre": {
            "id": membre.id,
            "nom": membre.nom,
            "prenom": membre.prenom,
            "telephone": membre.telephone,
            "lieu_residence": membre.lieu_residence,
            "montant_cotisation": float(
                membre.montant_cotisation
            ),
            "actif": membre.actif,
        },
        "utilisateur": {
            "id": utilisateur.id,
            "identifiant": utilisateur.identifiant,
            "premiere_connexion": utilisateur.premiere_connexion,
            "actif": utilisateur.actif,
        },
        "fonctions": [
            {
                "id": fonction.id,
                "nom": fonction.nom,
                "description": fonction.description,
            }
            for fonction in fonctions
        ],
        "kourels": [
            {
                "id": kourel.id,
                "nom": kourel.nom,
                "description": kourel.description,
            }
            for kourel in kourels
        ],
        "acces_initial": {
            "identifiant": membre.telephone,
            "mot_de_passe_initial": membre.telephone,
            "changer_mot_de_passe_a_la_premiere_connexion": True,
        },
    }


# ============================================================
# LISTER / RECHERCHER LES MEMBRES
# ============================================================

@router.get("")
def lister_membres(
    recherche: str | None = None,
    inclure_inactifs: bool = False,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("MEMBRE_CONSULTER")
    ),
):
    query = db.query(Membre)

    if not inclure_inactifs:
        query = query.filter(
            Membre.actif.is_(True)
        )

    if recherche:
        terme = f"%{recherche.strip()}%"

        query = query.filter(
            (Membre.nom.ilike(terme))
            | (Membre.prenom.ilike(terme))
            | (Membre.telephone.ilike(terme))
        )

    membres = (
        query
        .order_by(
            Membre.nom,
            Membre.prenom,
        )
        .all()
    )

    resultats = []

    for membre in membres:
        utilisateur = (
            db.query(Utilisateur)
            .filter(
                Utilisateur.membre_id == membre.id
            )
            .first()
        )

        fonctions = []

        if utilisateur:
            fonctions = recuperer_fonctions_utilisateur(
                utilisateur.id,
                db,
            )

        kourels = recuperer_kourels_membre(
            membre.id,
            db,
        )

        resultats.append(
            {
                "id": membre.id,
                "nom": membre.nom,
                "prenom": membre.prenom,
                "telephone": membre.telephone,
                "lieu_residence": membre.lieu_residence,
                "montant_cotisation": float(
                    membre.montant_cotisation
                ),
                "actif": membre.actif,
                "fonctions": [
                    {
                        "id": fonction.id,
                        "nom": fonction.nom,
                        "description": fonction.description,
                    }
                    for fonction in fonctions
                ],
                "kourels": [
                    {
                        "id": kourel.id,
                        "nom": kourel.nom,
                        "description": kourel.description,
                    }
                    for kourel in kourels
                ],
            }
        )

    return resultats


# ============================================================
# CONSULTER UN MEMBRE
# ============================================================

@router.get("/{membre_id}")
def obtenir_membre(
    membre_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("MEMBRE_CONSULTER")
    ),
):
    membre = (
        db.query(Membre)
        .filter(
            Membre.id == membre_id
        )
        .first()
    )

    if not membre:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membre introuvable.",
        )

    utilisateur = (
        db.query(Utilisateur)
        .filter(
            Utilisateur.membre_id == membre.id
        )
        .first()
    )

    fonctions = []

    if utilisateur:
        fonctions = recuperer_fonctions_utilisateur(
            utilisateur.id,
            db,
        )

    kourels = recuperer_kourels_membre(
        membre.id,
        db,
    )

    return {
        "id": membre.id,
        "nom": membre.nom,
        "prenom": membre.prenom,
        "telephone": membre.telephone,
        "lieu_residence": membre.lieu_residence,
        "montant_cotisation": float(
            membre.montant_cotisation
        ),
        "actif": membre.actif,
        "fonctions": [
            {
                "id": fonction.id,
                "nom": fonction.nom,
                "description": fonction.description,
            }
            for fonction in fonctions
        ],
        "kourels": [
            {
                "id": kourel.id,
                "nom": kourel.nom,
                "description": kourel.description,
            }
            for kourel in kourels
        ],
    }


# ============================================================
# MODIFIER UN MEMBRE
# + FONCTIONS
# + KOURELS
# + NOTIFICATION
#
# IMPORTANT :
# La modification du téléphone NE MODIFIE JAMAIS
# l'identifiant de connexion existant.
# ============================================================

@router.put("/{membre_id}")
def modifier_membre(
    membre_id: int,
    donnees: MembreUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("MEMBRE_MODIFIER")
    ),
):
    # --------------------------------------------------------
    # 1. Récupérer le membre
    # --------------------------------------------------------

    membre = (
        db.query(Membre)
        .filter(
            Membre.id == membre_id
        )
        .first()
    )

    if not membre:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membre introuvable.",
        )

    # --------------------------------------------------------
    # 2. Vérifier le téléphone
    # --------------------------------------------------------

    telephone_existant = (
        db.query(Membre)
        .filter(
            Membre.telephone == donnees.telephone,
            Membre.id != membre_id,
        )
        .first()
    )

    if telephone_existant:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Un autre membre utilise déjà ce numéro "
                "de téléphone."
            ),
        )

    # --------------------------------------------------------
    # 3. Vérifier les fonctions
    # --------------------------------------------------------

    fonction_ids = list(
        dict.fromkeys(donnees.fonction_ids)
    )

    fonctions = []

    if fonction_ids:
        fonctions = (
            db.query(Fonction)
            .filter(
                Fonction.id.in_(fonction_ids),
                Fonction.actif.is_(True),
            )
            .all()
        )

        if len(fonctions) != len(fonction_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Une ou plusieurs fonctions "
                    "sélectionnées sont invalides."
                ),
            )

    # --------------------------------------------------------
    # 4. Vérifier les Kourels
    # --------------------------------------------------------

    kourel_ids = list(
        dict.fromkeys(donnees.kourel_ids)
    )

    kourels = []

    if kourel_ids:
        kourels = (
            db.query(Kourel)
            .filter(
                Kourel.id.in_(kourel_ids),
                Kourel.actif.is_(True),
            )
            .all()
        )

        if len(kourels) != len(kourel_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Un ou plusieurs Kourels "
                    "sélectionnés sont invalides."
                ),
            )

    # --------------------------------------------------------
    # 5. Récupérer l'utilisateur
    #
    # IMPORTANT :
    # On ne modifie JAMAIS son identifiant ici.
    # --------------------------------------------------------

    utilisateur = (
        db.query(Utilisateur)
        .filter(
            Utilisateur.membre_id == membre.id
        )
        .first()
    )

    # --------------------------------------------------------
    # 6. Modifier les informations du membre
    # --------------------------------------------------------

    membre.nom = donnees.nom
    membre.prenom = donnees.prenom
    membre.telephone = donnees.telephone
    membre.lieu_residence = donnees.lieu_residence
    membre.montant_cotisation = donnees.montant_cotisation

    # --------------------------------------------------------
    # 7. Remplacer les fonctions
    # --------------------------------------------------------

    if utilisateur:
        db.query(UtilisateurFonction).filter(
            UtilisateurFonction.utilisateur_id
            == utilisateur.id
        ).delete(
            synchronize_session=False
        )

        for fonction in fonctions:
            db.add(
                UtilisateurFonction(
                    utilisateur_id=utilisateur.id,
                    fonction_id=fonction.id,
                )
            )

    # ========================================================
    # 8. SYNCHRONISER LES KOURELS
    # ========================================================
    #
    # Règle :
    #
    # - sélectionné + déjà existant = réactiver
    # - sélectionné + inexistant = créer
    # - existant + non sélectionné = désactiver
    #
    # On ne supprime jamais une ancienne affiliation.
    # Cela permet de conserver l'historique.
    #
    # La contrainte UNIQUE(kourel_id, membre_id) est respectée.
    # ========================================================

    toutes_affiliations = (
        db.query(KourelMembre)
        .filter(
            KourelMembre.membre_id == membre.id
        )
        .all()
    )

    # Ensemble des Kourels sélectionnés dans le formulaire
    kourel_ids_selectionnes = set(kourel_ids)

    # Dictionnaire :
    #
    # kourel_id -> affiliation existante
    #
    affiliations_par_kourel = {
        affiliation.kourel_id: affiliation
        for affiliation in toutes_affiliations
    }

    # --------------------------------------------------------
    # 8.1 Désactiver les affiliations retirées
    # --------------------------------------------------------

    for affiliation in toutes_affiliations:
        if affiliation.kourel_id not in kourel_ids_selectionnes:

            if affiliation.actif:
                affiliation.actif = False
                affiliation.date_sortie = date.today()

    # --------------------------------------------------------
    # 8.2 Ajouter ou réactiver les Kourels sélectionnés
    # --------------------------------------------------------

    for kourel_id in kourel_ids_selectionnes:

        affiliation = affiliations_par_kourel.get(
            kourel_id
        )

        if affiliation:
            # L'affiliation existe déjà.
            # On la réactive sans créer une deuxième ligne.

            affiliation.actif = True
            affiliation.date_sortie = None

        else:
            # Nouvelle affiliation.

            db.add(
                KourelMembre(
                    kourel_id=kourel_id,
                    membre_id=membre.id,
                    date_entree=date.today(),
                    date_sortie=None,
                    gestionnaire=False,
                    actif=True,
                )
            )

    # --------------------------------------------------------
    # 9. Notification de modification
    # --------------------------------------------------------

    if utilisateur and utilisateur.actif:
        creer_notification(
            db=db,
            utilisateur_id=utilisateur.id,
            titre="Profil mis à jour",
            message=(
                "Les informations de votre profil ont été "
                "modifiées avec succès."
            ),
            type="MEMBRE",
            route="/mon-espace",
        )

    # --------------------------------------------------------
    # 10. Enregistrer
    # --------------------------------------------------------

    try:
        db.commit()
        db.refresh(membre)

    except IntegrityError as erreur:
        db.rollback()

        print(
            "=============================================="
        )
        print(
            "ERREUR INTEGRITYERROR MODIFICATION MEMBRE"
        )
        print(
            "MEMBRE ID :",
            membre_id,
        )
        print(
            "DETAIL :",
            repr(erreur),
        )
        print(
            "=============================================="
        )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Impossible de modifier le membre. "
                "Une contrainte de la base de données "
                "empêche cette modification."
            ),
        )

    # --------------------------------------------------------
    # 11. Réponse
    # --------------------------------------------------------

    return {
        "message": "Membre modifié avec succès",
        "membre": {
            "id": membre.id,
            "nom": membre.nom,
            "prenom": membre.prenom,
            "telephone": membre.telephone,
            "lieu_residence": membre.lieu_residence,
            "montant_cotisation": float(
                membre.montant_cotisation
            ),
            "actif": membre.actif,
        },
        "fonctions": [
            {
                "id": fonction.id,
                "nom": fonction.nom,
                "description": fonction.description,
            }
            for fonction in fonctions
        ],
        "kourels": [
            {
                "id": kourel.id,
                "nom": kourel.nom,
                "description": kourel.description,
            }
            for kourel in kourels
        ],
    }


# ============================================================
# DÉSACTIVER UN MEMBRE
# + NOTIFICATION
# ============================================================

@router.patch("/{membre_id}/desactiver")
def desactiver_membre(
    membre_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("MEMBRE_MODIFIER")
    ),
):
    membre = (
        db.query(Membre)
        .filter(
            Membre.id == membre_id
        )
        .first()
    )

    if not membre:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membre introuvable.",
        )

    if not membre.actif:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ce membre est déjà désactivé.",
        )

    utilisateur = None

    try:
        membre.actif = False

        utilisateur = (
            db.query(Utilisateur)
            .filter(
                Utilisateur.membre_id == membre.id
            )
            .first()
        )

        if utilisateur:
            utilisateur.actif = False

            creer_notification(
                db=db,
                utilisateur_id=utilisateur.id,
                titre="Compte désactivé",
                message=(
                    "Votre compte et votre adhésion au Dahira "
                    "ont été désactivés. "
                    "Vous ne pouvez plus vous connecter."
                ),
                type="MEMBRE",
                route="/login",
            )

        db.commit()
        db.refresh(membre)

    except IntegrityError as erreur:
        db.rollback()

        print(
            "ERREUR DESACTIVATION MEMBRE :",
            repr(erreur),
        )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Impossible de désactiver le membre.",
        )

    return {
        "message": "Membre désactivé avec succès",
        "id": membre.id,
        "actif": membre.actif,
    }


# ============================================================
# RÉACTIVER UN MEMBRE
# + NOTIFICATION
# ============================================================

@router.patch("/{membre_id}/activer")
def activer_membre(
    membre_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("MEMBRE_MODIFIER")
    ),
):
    membre = (
        db.query(Membre)
        .filter(
            Membre.id == membre_id
        )
        .first()
    )

    if not membre:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membre introuvable.",
        )

    if membre.actif:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ce membre est déjà actif.",
        )

    utilisateur = None

    try:
        membre.actif = True

        utilisateur = (
            db.query(Utilisateur)
            .filter(
                Utilisateur.membre_id == membre.id
            )
            .first()
        )

        if utilisateur:
            utilisateur.actif = True

            creer_notification(
                db=db,
                utilisateur_id=utilisateur.id,
                titre="Compte réactivé",
                message=(
                    "Votre compte a été réactivé. "
                    "Vous pouvez maintenant vous connecter "
                    "à votre espace."
                ),
                type="MEMBRE",
                route="/mon-espace",
            )

        db.commit()
        db.refresh(membre)

    except IntegrityError as erreur:
        db.rollback()

        print(
            "ERREUR REACTIVATION MEMBRE :",
            repr(erreur),
        )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Impossible de réactiver le membre.",
        )

    return {
        "message": "Membre réactivé avec succès",
        "id": membre.id,
        "actif": membre.actif,
    }

