from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db

from app.models.utilisateur import Utilisateur
from app.models.utilisateur_fonction import UtilisateurFonction
from app.models.fonction import Fonction
from app.models.membre import Membre

from app.schemas.utilisateur import (
    UtilisateurCreate,
    UtilisateurUpdate,
    ModifierMotDePasse,
    UtilisateurResponse,
)


router = APIRouter(
    prefix="/utilisateurs",
    tags=["Utilisateurs"],
)


# ============================================================
# OUTIL : CONSTRUIRE LA RÉPONSE
# ============================================================

def construire_utilisateur(
    utilisateur: Utilisateur,
    db: Session,
):
    fonctions = (
        db.query(Fonction)
        .join(
            UtilisateurFonction,
            UtilisateurFonction.fonction_id == Fonction.id
        )
        .filter(
            UtilisateurFonction.utilisateur_id == utilisateur.id,
            Fonction.actif == True
        )
        .order_by(Fonction.nom.asc())
        .all()
    )

    return {
        "id": utilisateur.id,
        "membre_id": utilisateur.membre_id,
        "identifiant": utilisateur.identifiant,
        "premiere_connexion": utilisateur.premiere_connexion,
        "actif": utilisateur.actif,
        "dernier_acces": utilisateur.dernier_acces,
        "created_at": utilisateur.created_at,
        "fonctions": fonctions,
    }


# ============================================================
# LISTER LES UTILISATEURS
# ============================================================

@router.get(
    "",
    response_model=list[UtilisateurResponse],
)
def lister_utilisateurs(
    recherche: str | None = None,
    inclure_inactifs: bool = False,
    db: Session = Depends(get_db),
):
    query = db.query(Utilisateur)

    if not inclure_inactifs:
        query = query.filter(
            Utilisateur.actif == True
        )

    if recherche:
        recherche = recherche.strip()

        if recherche:
            query = query.filter(
                Utilisateur.identifiant.ilike(
                    f"%{recherche}%"
                )
            )

    utilisateurs = (
        query
        .order_by(Utilisateur.identifiant.asc())
        .all()
    )

    return [
        construire_utilisateur(
            utilisateur,
            db
        )
        for utilisateur in utilisateurs
    ]


# ============================================================
# CONSULTER UN UTILISATEUR
# ============================================================

@router.get(
    "/{utilisateur_id}",
    response_model=UtilisateurResponse,
)
def consulter_utilisateur(
    utilisateur_id: int,
    db: Session = Depends(get_db),
):
    utilisateur = (
        db.query(Utilisateur)
        .filter(
            Utilisateur.id == utilisateur_id
        )
        .first()
    )

    if not utilisateur:
        raise HTTPException(
            status_code=404,
            detail="Utilisateur introuvable.",
        )

    return construire_utilisateur(
        utilisateur,
        db
    )


# ============================================================
# CRÉER UN UTILISATEUR
# ============================================================

@router.post(
    "",
    response_model=UtilisateurResponse,
    status_code=status.HTTP_201_CREATED,
)
def creer_utilisateur(
    data: UtilisateurCreate,
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # Vérifier le membre
    # --------------------------------------------------------

    membre = (
        db.query(Membre)
        .filter(
            Membre.id == data.membre_id,
            Membre.actif == True,
        )
        .first()
    )

    if not membre:
        raise HTTPException(
            status_code=404,
            detail="Membre introuvable ou inactif.",
        )

    # --------------------------------------------------------
    # Vérifier si le membre possède déjà un compte
    # --------------------------------------------------------

    compte_existant = (
        db.query(Utilisateur)
        .filter(
            Utilisateur.membre_id == data.membre_id
        )
        .first()
    )

    if compte_existant:
        raise HTTPException(
            status_code=400,
            detail="Ce membre possède déjà un compte utilisateur.",
        )

    # --------------------------------------------------------
    # Vérifier identifiant
    # --------------------------------------------------------

    identifiant = data.identifiant.strip()

    existe = (
        db.query(Utilisateur)
        .filter(
            Utilisateur.identifiant == identifiant
        )
        .first()
    )

    if existe:
        raise HTTPException(
            status_code=400,
            detail="Cet identifiant est déjà utilisé.",
        )

    # --------------------------------------------------------
    # Vérifier les fonctions
    # --------------------------------------------------------

    fonctions = []

    if data.fonction_ids:

        fonctions = (
            db.query(Fonction)
            .filter(
                Fonction.id.in_(data.fonction_ids),
                Fonction.actif == True,
            )
            .all()
        )

        if len(fonctions) != len(set(data.fonction_ids)):
            raise HTTPException(
                status_code=400,
                detail="Une ou plusieurs fonctions sont invalides.",
            )

    # --------------------------------------------------------
    # Hash du mot de passe
    # --------------------------------------------------------

    from app.core.security import hasher_mot_de_passe

    mot_de_passe_hash = hasher_mot_de_passe(
    data.mot_de_passe
)

    # --------------------------------------------------------
    # Création
    # --------------------------------------------------------

    utilisateur = Utilisateur(
        membre_id=data.membre_id,
        identifiant=identifiant,
        mot_de_passe_hash=mot_de_passe_hash,
        premiere_connexion=True,
        actif=True,
    )

    db.add(utilisateur)
    db.flush()

    # --------------------------------------------------------
    # Fonctions
    # --------------------------------------------------------

    for fonction in fonctions:

        liaison = UtilisateurFonction(
            utilisateur_id=utilisateur.id,
            fonction_id=fonction.id,
        )

        db.add(liaison)

    db.commit()
    db.refresh(utilisateur)

    return construire_utilisateur(
        utilisateur,
        db
    )


# ============================================================
# MODIFIER UN UTILISATEUR
# ============================================================

@router.put(
    "/{utilisateur_id}",
    response_model=UtilisateurResponse,
)
def modifier_utilisateur(
    utilisateur_id: int,
    data: UtilisateurUpdate,
    db: Session = Depends(get_db),
):
    utilisateur = (
        db.query(Utilisateur)
        .filter(
            Utilisateur.id == utilisateur_id
        )
        .first()
    )

    if not utilisateur:
        raise HTTPException(
            status_code=404,
            detail="Utilisateur introuvable.",
        )

    # --------------------------------------------------------
    # Identifiant
    # --------------------------------------------------------

    if data.identifiant is not None:

        identifiant = data.identifiant.strip()

        existe = (
            db.query(Utilisateur)
            .filter(
                Utilisateur.identifiant == identifiant,
                Utilisateur.id != utilisateur_id,
            )
            .first()
        )

        if existe:
            raise HTTPException(
                status_code=400,
                detail="Cet identifiant est déjà utilisé.",
            )

        utilisateur.identifiant = identifiant

    # --------------------------------------------------------
    # Fonctions
    # --------------------------------------------------------

    if data.fonction_ids is not None:

        fonctions = (
            db.query(Fonction)
            .filter(
                Fonction.id.in_(data.fonction_ids),
                Fonction.actif == True,
            )
            .all()
        )

        if len(fonctions) != len(set(data.fonction_ids)):
            raise HTTPException(
                status_code=400,
                detail="Une ou plusieurs fonctions sont invalides.",
            )

        db.query(UtilisateurFonction).filter(
            UtilisateurFonction.utilisateur_id
            == utilisateur_id
        ).delete(
            synchronize_session=False
        )

        for fonction in fonctions:

            db.add(
                UtilisateurFonction(
                    utilisateur_id=utilisateur_id,
                    fonction_id=fonction.id,
                )
            )

    db.commit()
    db.refresh(utilisateur)

    return construire_utilisateur(
        utilisateur,
        db
    )


# ============================================================
# MODIFIER MOT DE PASSE
# ============================================================

@router.patch(
    "/{utilisateur_id}/mot-de-passe",
)
def modifier_mot_de_passe(
    utilisateur_id: int,
    data: ModifierMotDePasse,
    db: Session = Depends(get_db),
):
    utilisateur = (
        db.query(Utilisateur)
        .filter(
            Utilisateur.id == utilisateur_id
        )
        .first()
    )

    if not utilisateur:
        raise HTTPException(
            status_code=404,
            detail="Utilisateur introuvable.",
        )

    from app.core.security import hasher_mot_de_passe

    mot_de_passe_hash = hasher_mot_de_passe(
    data.mot_de_passe
)

    utilisateur.premiere_connexion = True

    db.commit()

    return {
        "message": "Mot de passe modifié avec succès."
    }


# ============================================================
# DÉSACTIVER
# ============================================================

@router.patch(
    "/{utilisateur_id}/desactiver",
)
def desactiver_utilisateur(
    utilisateur_id: int,
    db: Session = Depends(get_db),
):
    utilisateur = (
        db.query(Utilisateur)
        .filter(
            Utilisateur.id == utilisateur_id
        )
        .first()
    )

    if not utilisateur:
        raise HTTPException(
            status_code=404,
            detail="Utilisateur introuvable.",
        )

    utilisateur.actif = False

    db.commit()

    return {
        "message": "Utilisateur désactivé."
    }


# ============================================================
# RÉACTIVER
# ============================================================

@router.patch(
    "/{utilisateur_id}/activer",
)
def activer_utilisateur(
    utilisateur_id: int,
    db: Session = Depends(get_db),
):
    utilisateur = (
        db.query(Utilisateur)
        .filter(
            Utilisateur.id == utilisateur_id
        )
        .first()
    )

    if not utilisateur:
        raise HTTPException(
            status_code=404,
            detail="Utilisateur introuvable.",
        )

    utilisateur.actif = True

    db.commit()

    return {
        "message": "Utilisateur réactivé."
    }