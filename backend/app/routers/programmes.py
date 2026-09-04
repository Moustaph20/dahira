from calendar import monthrange
from datetime import date, time

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import (
    require_permission,
    require_kourel_gestionnaire,
)

from app.models.programme_mensuel import ProgrammeMensuel
from app.models.repetition import Repetition
from app.models.declamation import Declamation
from app.models.declamation_khassida import DeclamationKhassida
from app.models.khassida import Khassida
from app.models.ton import Ton
from app.models.audio import Audio


router = APIRouter(
    prefix="/programmes-religieux",
    tags=["Programmes religieux"],
)


# ============================================================
# UTILITAIRES
# ============================================================

def obtenir_programme_actif(
    programme_id: int,
    db: Session,
) -> ProgrammeMensuel:

    programme = (
        db.query(ProgrammeMensuel)
        .filter(
            ProgrammeMensuel.id == programme_id,
            ProgrammeMensuel.actif.is_(True),
        )
        .first()
    )

    if not programme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Programme religieux introuvable.",
        )

    return programme


def verifier_date_dans_programme(
    programme: ProgrammeMensuel,
    valeur: date,
) -> None:

    if not (
        programme.date_debut
        <= valeur
        <= programme.date_fin
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "La date doit appartenir "
                "au mois du programme."
            ),
        )


def verifier_heures(
    heure_debut: time | None,
    heure_fin: time | None,
) -> None:

    if (
        heure_debut is not None
        and heure_fin is not None
        and heure_fin <= heure_debut
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "L'heure de fin doit être "
                "postérieure à l'heure de début."
            ),
        )


def nettoyer_texte(
    valeur: str | None,
) -> str | None:

    if valeur is None:
        return None

    valeur = valeur.strip()

    return valeur if valeur else None


# ============================================================
# PROGRAMMES
# ============================================================


# ============================================================
# LISTER LES PROGRAMMES
#
# CONSULTATION
#
# Gestionnaire + membres autorisés à consulter
# ============================================================

@router.get("")
def lister_programmes(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CONSULTER")
    ),
):

    programmes = (
        db.query(ProgrammeMensuel)
        .filter(
            ProgrammeMensuel.actif.is_(True),
        )
        .order_by(
            ProgrammeMensuel.annee.desc(),
            ProgrammeMensuel.mois.desc(),
        )
        .all()
    )

    return [
        {
            "id": programme.id,
            "kourel_id": programme.kourel_id,
            "annee": programme.annee,
            "mois": programme.mois,
            "date_debut": programme.date_debut,
            "date_fin": programme.date_fin,
            "actif": programme.actif,
        }
        for programme in programmes
    ]


# ============================================================
# CRÉER UN PROGRAMME
#
# GESTIONNAIRE UNIQUEMENT
# ============================================================

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
def creer_programme(
    kourel_id: int,
    annee: int,
    mois: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_kourel_gestionnaire
    ),
):

    # --------------------------------------------------------
    # VALIDATION DU MOIS
    # --------------------------------------------------------

    if mois < 1 or mois > 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le mois doit être compris entre 1 et 12.",
        )

    # --------------------------------------------------------
    # VALIDATION DE L'ANNÉE
    # --------------------------------------------------------

    if annee < 2000 or annee > 2100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="L'année est invalide.",
        )

    # --------------------------------------------------------
    # VÉRIFIER LES DOUBLONS
    # --------------------------------------------------------

    programme_existant = (
        db.query(ProgrammeMensuel)
        .filter(
            ProgrammeMensuel.kourel_id == kourel_id,
            ProgrammeMensuel.annee == annee,
            ProgrammeMensuel.mois == mois,
            ProgrammeMensuel.actif.is_(True),
        )
        .first()
    )

    if programme_existant:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Le programme de ce mois existe déjà "
                "pour ce Kourel."
            ),
        )

    # --------------------------------------------------------
    # DATES
    # --------------------------------------------------------

    dernier_jour = monthrange(
        annee,
        mois,
    )[1]

    programme = ProgrammeMensuel(
        kourel_id=kourel_id,
        annee=annee,
        mois=mois,
        date_debut=date(
            annee,
            mois,
            1,
        ),
        date_fin=date(
            annee,
            mois,
            dernier_jour,
        ),
        actif=True,
    )

    db.add(programme)

    try:
        db.commit()
        db.refresh(programme)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Impossible de créer "
                "le programme religieux."
            ),
        )

    return {
        "message": "Programme religieux créé avec succès.",
        "id": programme.id,
        "kourel_id": programme.kourel_id,
        "annee": programme.annee,
        "mois": programme.mois,
        "date_debut": programme.date_debut,
        "date_fin": programme.date_fin,
        "actif": programme.actif,
    }


# ============================================================
# CONSULTER UN PROGRAMME COMPLET
#
# CONSULTATION UNIQUEMENT
# ============================================================

@router.get(
    "/{programme_id}"
)
def consulter_programme(
    programme_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CONSULTER")
    ),
):

    programme = obtenir_programme_actif(
        programme_id,
        db,
    )

    # ========================================================
    # RÉPÉTITIONS
    # ========================================================

    repetitions = (
        db.query(Repetition)
        .filter(
            Repetition.programme_id == programme_id,
            Repetition.actif.is_(True),
        )
        .order_by(
            Repetition.date_repetition.asc(),
        )
        .all()
    )

    repetitions_data = [
        {
            "id": repetition.id,
            "programme_id": repetition.programme_id,
            "date_repetition": repetition.date_repetition,
            "date": repetition.date_repetition,
            "heure_debut": repetition.heure_debut,
            "heure_fin": repetition.heure_fin,
            "lieu": repetition.lieu,
            "actif": repetition.actif,
        }
        for repetition in repetitions
    ]

    # ========================================================
    # DÉCLAMATIONS
    # ========================================================

    declamations = (
        db.query(Declamation)
        .filter(
            Declamation.programme_id == programme_id,
            Declamation.actif.is_(True),
        )
        .order_by(
            Declamation.date_declamation.asc(),
            Declamation.id.asc(),
        )
        .all()
    )

    evenements = []

    for declamation in declamations:

        # ----------------------------------------------------
        # KHASSIDAS
        # ----------------------------------------------------

        choix = (
            db.query(
                DeclamationKhassida,
                Khassida,
                Ton,
            )
            .join(
                Khassida,
                Khassida.id
                == DeclamationKhassida.khassida_id,
            )
            .join(
                Ton,
                Ton.id
                == DeclamationKhassida.ton_id,
            )
            .filter(
                DeclamationKhassida.declamation_id
                == declamation.id,
            )
            .order_by(
                DeclamationKhassida.ordre.asc(),
            )
            .all()
        )

        khassidas = []

        for (
            choix_khassida,
            khassida,
            ton,
        ) in choix:

            # ------------------------------------------------
            # AUDIOS
            # ------------------------------------------------

            audios = (
                db.query(Audio)
                .filter(
                    Audio.ton_id == ton.id,
                    Audio.actif.is_(True),
                )
                .order_by(
                    Audio.titre.asc(),
                )
                .all()
            )

            khassidas.append(
                {
                    "ordre": choix_khassida.ordre,

                    "khassida": {
                        "id": khassida.id,
                        "titre": khassida.titre,
                        "auteur": khassida.auteur,
                        "description": khassida.description,
                    },

                    "ton": {
                        "id": ton.id,
                        "nom": ton.nom,
                    },

                    "audios": [
                        {
                            "id": audio.id,
                            "titre": audio.titre,
                            "url": (
                                f"/{audio.fichier}"
                                if audio.fichier
                                else None
                            ),
                            "description": audio.description,
                        }
                        for audio in audios
                    ],
                }
            )

        evenements.append(
            {
                "id": declamation.id,
                "programme_id": declamation.programme_id,
                "date_declamation":
                    declamation.date_declamation,
                "date":
                    declamation.date_declamation,
                "heure":
                    declamation.heure,
                "lieu":
                    declamation.lieu,
                "evenement":
                    declamation.evenement,

                "declamation": {
                    "khassidas": khassidas,
                },
            }
        )

    # ========================================================
    # RÉPONSE
    # ========================================================

    return {
        "id": programme.id,
        "kourel_id": programme.kourel_id,
        "annee": programme.annee,
        "mois": programme.mois,
        "date_debut": programme.date_debut,
        "date_fin": programme.date_fin,
        "actif": programme.actif,

        "programme": {
            "id": programme.id,
            "kourel_id": programme.kourel_id,
            "annee": programme.annee,
            "mois": programme.mois,
            "date_debut": programme.date_debut,
            "date_fin": programme.date_fin,
            "actif": programme.actif,
        },

        "repetitions": repetitions_data,

        "declamations": evenements,

        "evenements": evenements,
    }


# ============================================================
# MODIFIER UN PROGRAMME
#
# GESTIONNAIRE UNIQUEMENT
# ============================================================

@router.put(
    "/{programme_id}"
)
def modifier_programme(
    programme_id: int,
    annee: int | None = None,
    mois: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_kourel_gestionnaire
    ),
):

    programme = obtenir_programme_actif(
        programme_id,
        db,
    )

    nouvelle_annee = (
        annee
        if annee is not None
        else programme.annee
    )

    nouveau_mois = (
        mois
        if mois is not None
        else programme.mois
    )

    # --------------------------------------------------------
    # VALIDATIONS
    # --------------------------------------------------------

    if nouveau_mois < 1 or nouveau_mois > 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le mois doit être compris entre 1 et 12.",
        )

    if nouvelle_annee < 2000 or nouvelle_annee > 2100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="L'année est invalide.",
        )

    # --------------------------------------------------------
    # DOUBLON
    # --------------------------------------------------------

    doublon = (
        db.query(ProgrammeMensuel)
        .filter(
            ProgrammeMensuel.kourel_id
            == programme.kourel_id,
            ProgrammeMensuel.annee
            == nouvelle_annee,
            ProgrammeMensuel.mois
            == nouveau_mois,
            ProgrammeMensuel.id != programme_id,
            ProgrammeMensuel.actif.is_(True),
        )
        .first()
    )

    if doublon:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Un programme existe déjà "
                "pour ce mois."
            ),
        )

    # --------------------------------------------------------
    # MISE À JOUR
    # --------------------------------------------------------

    dernier_jour = monthrange(
        nouvelle_annee,
        nouveau_mois,
    )[1]

    programme.annee = nouvelle_annee
    programme.mois = nouveau_mois

    programme.date_debut = date(
        nouvelle_annee,
        nouveau_mois,
        1,
    )

    programme.date_fin = date(
        nouvelle_annee,
        nouveau_mois,
        dernier_jour,
    )

    try:
        db.commit()
        db.refresh(programme)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Impossible de modifier le programme.",
        )

    return {
        "message": "Programme modifié avec succès.",
        "id": programme.id,
        "kourel_id": programme.kourel_id,
        "annee": programme.annee,
        "mois": programme.mois,
        "date_debut": programme.date_debut,
        "date_fin": programme.date_fin,
        "actif": programme.actif,
    }


# ============================================================
# SUPPRIMER UN PROGRAMME
#
# GESTIONNAIRE UNIQUEMENT
#
# SUPPRESSION LOGIQUE
# ============================================================

@router.delete(
    "/{programme_id}"
)
def supprimer_programme(
    programme_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_kourel_gestionnaire
    ),
):

    programme = obtenir_programme_actif(
        programme_id,
        db,
    )

    programme.actif = False

    try:
        db.commit()

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Impossible de supprimer le programme.",
        )

    return {
        "message": "Programme supprimé avec succès."
    }


# ============================================================
# RÉPÉTITIONS
# ============================================================


# ============================================================
# GÉNÉRER LES RÉPÉTITIONS DU JEUDI
#
# GESTIONNAIRE UNIQUEMENT
# ============================================================

@router.post(
    "/{programme_id}/repetitions/generer"
)
def generer_repetitions(
    programme_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_kourel_gestionnaire
    ),
):

    programme = obtenir_programme_actif(
        programme_id,
        db,
    )

    repetitions_existantes = (
        db.query(Repetition)
        .filter(
            Repetition.programme_id == programme_id,
            Repetition.actif.is_(True),
        )
        .count()
    )

    if repetitions_existantes > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Les répétitions de ce programme "
                "ont déjà été générées."
            ),
        )

    repetitions = []

    dernier_jour = monthrange(
        programme.annee,
        programme.mois,
    )[1]

    for jour in range(
        1,
        dernier_jour + 1,
    ):

        jour_date = date(
            programme.annee,
            programme.mois,
            jour,
        )

        # Jeudi = 3
        if jour_date.weekday() == 3:

            repetition = Repetition(
                programme_id=programme_id,
                date_repetition=jour_date,
                actif=True,
            )

            db.add(repetition)
            repetitions.append(repetition)

    try:
        db.commit()

        for repetition in repetitions:
            db.refresh(repetition)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Impossible de générer "
                "les répétitions."
            ),
        )

    return [
        {
            "id": repetition.id,
            "programme_id": repetition.programme_id,
            "date_repetition": repetition.date_repetition,
            "date": repetition.date_repetition,
            "heure_debut": repetition.heure_debut,
            "heure_fin": repetition.heure_fin,
            "lieu": repetition.lieu,
            "actif": repetition.actif,
        }
        for repetition in repetitions
    ]


# ============================================================
# LISTER LES RÉPÉTITIONS
#
# CONSULTATION
# ============================================================

@router.get(
    "/{programme_id}/repetitions"
)
def lister_repetitions(
    programme_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CONSULTER")
    ),
):

    obtenir_programme_actif(
        programme_id,
        db,
    )

    repetitions = (
        db.query(Repetition)
        .filter(
            Repetition.programme_id == programme_id,
            Repetition.actif.is_(True),
        )
        .order_by(
            Repetition.date_repetition.asc(),
            Repetition.id.asc(),
        )
        .all()
    )

    return [
        {
            "id": repetition.id,
            "programme_id": repetition.programme_id,
            "date_repetition":
                repetition.date_repetition,
            "date":
                repetition.date_repetition,
            "heure_debut":
                repetition.heure_debut,
            "heure_fin":
                repetition.heure_fin,
            "lieu":
                repetition.lieu,
            "actif":
                repetition.actif,
        }
        for repetition in repetitions
    ]


# ============================================================
# AJOUTER UNE RÉPÉTITION
#
# GESTIONNAIRE UNIQUEMENT
# ============================================================

@router.post(
    "/{programme_id}/repetitions",
    status_code=status.HTTP_201_CREATED,
)
def ajouter_repetition(
    programme_id: int,
    date_repetition: date,
    heure_debut: time | None = None,
    heure_fin: time | None = None,
    lieu: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_kourel_gestionnaire
    ),
):

    programme = obtenir_programme_actif(
        programme_id,
        db,
    )

    # --------------------------------------------------------
    # DATE
    # --------------------------------------------------------

    verifier_date_dans_programme(
        programme,
        date_repetition,
    )

    # --------------------------------------------------------
    # HEURES
    # --------------------------------------------------------

    verifier_heures(
        heure_debut,
        heure_fin,
    )

    # --------------------------------------------------------
    # DOUBLON
    # --------------------------------------------------------

    repetition_existante = (
        db.query(Repetition)
        .filter(
            Repetition.programme_id == programme_id,
            Repetition.date_repetition
            == date_repetition,
            Repetition.actif.is_(True),
        )
        .first()
    )

    if repetition_existante:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Une répétition existe déjà "
                "à cette date."
            ),
        )

    repetition = Repetition(
        programme_id=programme_id,
        date_repetition=date_repetition,
        heure_debut=heure_debut,
        heure_fin=heure_fin,
        lieu=nettoyer_texte(lieu),
        actif=True,
    )

    db.add(repetition)

    try:
        db.commit()
        db.refresh(repetition)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Impossible d'ajouter la répétition.",
        )

    return {
        "message": "Répétition ajoutée avec succès.",
        "id": repetition.id,
        "programme_id": repetition.programme_id,
        "date_repetition": repetition.date_repetition,
        "date": repetition.date_repetition,
        "heure_debut": repetition.heure_debut,
        "heure_fin": repetition.heure_fin,
        "lieu": repetition.lieu,
        "actif": repetition.actif,
    }


# ============================================================
# MODIFIER UNE RÉPÉTITION
#
# GESTIONNAIRE UNIQUEMENT
# ============================================================

@router.put(
    "/{programme_id}/repetitions/{repetition_id}"
)
def modifier_repetition(
    programme_id: int,
    repetition_id: int,
    date_repetition: date | None = None,
    heure_debut: time | None = None,
    heure_fin: time | None = None,
    lieu: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_kourel_gestionnaire
    ),
):

    programme = obtenir_programme_actif(
        programme_id,
        db,
    )

    repetition = (
        db.query(Repetition)
        .filter(
            Repetition.id == repetition_id,
            Repetition.programme_id == programme_id,
            Repetition.actif.is_(True),
        )
        .first()
    )

    if not repetition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Répétition introuvable.",
        )

    # --------------------------------------------------------
    # DATE
    # --------------------------------------------------------

    nouvelle_date = (
        date_repetition
        if date_repetition is not None
        else repetition.date_repetition
    )

    verifier_date_dans_programme(
        programme,
        nouvelle_date,
    )

    # --------------------------------------------------------
    # HEURES
    # --------------------------------------------------------

    nouvelle_heure_debut = (
        heure_debut
        if heure_debut is not None
        else repetition.heure_debut
    )

    nouvelle_heure_fin = (
        heure_fin
        if heure_fin is not None
        else repetition.heure_fin
    )

    verifier_heures(
        nouvelle_heure_debut,
        nouvelle_heure_fin,
    )

    # --------------------------------------------------------
    # DOUBLON DE DATE
    # --------------------------------------------------------

    if date_repetition is not None:

        doublon = (
            db.query(Repetition)
            .filter(
                Repetition.programme_id == programme_id,
                Repetition.date_repetition
                == date_repetition,
                Repetition.id != repetition_id,
                Repetition.actif.is_(True),
            )
            .first()
        )

        if doublon:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Une autre répétition existe déjà "
                    "à cette date."
                ),
            )

    # --------------------------------------------------------
    # APPLICATION
    # --------------------------------------------------------

    repetition.date_repetition = nouvelle_date
    repetition.heure_debut = nouvelle_heure_debut
    repetition.heure_fin = nouvelle_heure_fin

    if lieu is not None:
        repetition.lieu = nettoyer_texte(lieu)

    try:
        db.commit()
        db.refresh(repetition)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Impossible de modifier la répétition.",
        )

    return {
        "message": "Répétition modifiée avec succès.",
        "id": repetition.id,
        "programme_id": repetition.programme_id,
        "date_repetition": repetition.date_repetition,
        "date": repetition.date_repetition,
        "heure_debut": repetition.heure_debut,
        "heure_fin": repetition.heure_fin,
        "lieu": repetition.lieu,
        "actif": repetition.actif,
    }


# ============================================================
# SUPPRIMER UNE RÉPÉTITION
#
# GESTIONNAIRE UNIQUEMENT
#
# SUPPRESSION LOGIQUE
# ============================================================

@router.delete(
    "/{programme_id}/repetitions/{repetition_id}"
)
def supprimer_repetition(
    programme_id: int,
    repetition_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_kourel_gestionnaire
    ),
):

    obtenir_programme_actif(
        programme_id,
        db,
    )

    repetition = (
        db.query(Repetition)
        .filter(
            Repetition.id == repetition_id,
            Repetition.programme_id == programme_id,
            Repetition.actif.is_(True),
        )
        .first()
    )

    if not repetition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Répétition introuvable.",
        )

    repetition.actif = False

    try:
        db.commit()

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Impossible de supprimer la répétition.",
        )

    return {
        "message": "Répétition supprimée avec succès."
    }


# ============================================================
# DÉCLAMATIONS
# ============================================================


# ============================================================
# LISTER LES DÉCLAMATIONS
#
# CONSULTATION
# ============================================================

@router.get(
    "/{programme_id}/declamations"
)
def lister_declamations(
    programme_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CONSULTER")
    ),
):

    obtenir_programme_actif(
        programme_id,
        db,
    )

    declamations = (
        db.query(Declamation)
        .filter(
            Declamation.programme_id == programme_id,
            Declamation.actif.is_(True),
        )
        .order_by(
            Declamation.date_declamation.asc(),
            Declamation.id.asc(),
        )
        .all()
    )

    return [
        {
            "id": declamation.id,
            "programme_id":
                declamation.programme_id,
            "date_declamation":
                declamation.date_declamation,
            "date":
                declamation.date_declamation,
            "heure":
                declamation.heure,
            "lieu":
                declamation.lieu,
            "evenement":
                declamation.evenement,
            "actif":
                declamation.actif,
        }
        for declamation in declamations
    ]


# ============================================================
# AJOUTER UNE DÉCLAMATION
#
# GESTIONNAIRE UNIQUEMENT
# ============================================================

@router.post(
    "/{programme_id}/declamations",
    status_code=status.HTTP_201_CREATED,
)
def ajouter_declamation(
    programme_id: int,
    date_declamation: date,
    evenement: str,
    heure: time | None = None,
    lieu: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_kourel_gestionnaire
    ),
):

    programme = obtenir_programme_actif(
        programme_id,
        db,
    )

    # --------------------------------------------------------
    # DATE
    # --------------------------------------------------------

    verifier_date_dans_programme(
        programme,
        date_declamation,
    )

    # --------------------------------------------------------
    # ÉVÉNEMENT
    # --------------------------------------------------------

    evenement = evenement.strip()

    if not evenement:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="L'événement est obligatoire.",
        )

    # --------------------------------------------------------
    # DOUBLON
    # --------------------------------------------------------

    declamation_existante = (
        db.query(Declamation)
        .filter(
            Declamation.programme_id == programme_id,
            Declamation.date_declamation
            == date_declamation,
            Declamation.evenement
            == evenement,
            Declamation.actif.is_(True),
        )
        .first()
    )

    if declamation_existante:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Cette déclamation existe déjà "
                "pour cette date."
            ),
        )

    declamation = Declamation(
        programme_id=programme_id,
        date_declamation=date_declamation,
        heure=heure,
        lieu=nettoyer_texte(lieu),
        evenement=evenement,
        actif=True,
    )

    db.add(declamation)

    try:
        db.commit()
        db.refresh(declamation)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Impossible d'ajouter la déclamation.",
        )

    return {
        "message": "Événement ajouté avec succès.",
        "id": declamation.id,
        "programme_id": declamation.programme_id,
        "date_declamation":
            declamation.date_declamation,
        "date":
            declamation.date_declamation,
        "heure":
            declamation.heure,
        "lieu":
            declamation.lieu,
        "evenement":
            declamation.evenement,
        "actif":
            declamation.actif,
    }


# ============================================================
# MODIFIER UNE DÉCLAMATION
#
# GESTIONNAIRE UNIQUEMENT
# ============================================================

@router.put(
    "/{programme_id}/declamations/{declamation_id}"
)
def modifier_declamation(
    programme_id: int,
    declamation_id: int,
    date_declamation: date | None = None,
    evenement: str | None = None,
    heure: time | None = None,
    lieu: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_kourel_gestionnaire
    ),
):

    programme = obtenir_programme_actif(
        programme_id,
        db,
    )

    declamation = (
        db.query(Declamation)
        .filter(
            Declamation.id == declamation_id,
            Declamation.programme_id == programme_id,
            Declamation.actif.is_(True),
        )
        .first()
    )

    if not declamation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Déclamation introuvable.",
        )

    # --------------------------------------------------------
    # DATE
    # --------------------------------------------------------

    if date_declamation is not None:

        verifier_date_dans_programme(
            programme,
            date_declamation,
        )

        declamation.date_declamation = (
            date_declamation
        )

    # --------------------------------------------------------
    # ÉVÉNEMENT
    # --------------------------------------------------------

    if evenement is not None:

        evenement = evenement.strip()

        if not evenement:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="L'événement est obligatoire.",
            )

        declamation.evenement = evenement

    # --------------------------------------------------------
    # HEURE
    # --------------------------------------------------------

    if heure is not None:
        declamation.heure = heure

    # --------------------------------------------------------
    # LIEU
    # --------------------------------------------------------

    if lieu is not None:
        declamation.lieu = nettoyer_texte(lieu)

    try:
        db.commit()
        db.refresh(declamation)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Impossible de modifier la déclamation.",
        )

    return {
        "message": "Déclamation modifiée avec succès.",
        "id": declamation.id,
        "programme_id": declamation.programme_id,
        "date_declamation":
            declamation.date_declamation,
        "date":
            declamation.date_declamation,
        "heure":
            declamation.heure,
        "lieu":
            declamation.lieu,
        "evenement":
            declamation.evenement,
        "actif":
            declamation.actif,
    }


# ============================================================
# SUPPRIMER UNE DÉCLAMATION
#
# GESTIONNAIRE UNIQUEMENT
#
# SUPPRESSION LOGIQUE
# ============================================================

@router.delete(
    "/{programme_id}/declamations/{declamation_id}"
)
def supprimer_declamation(
    programme_id: int,
    declamation_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_kourel_gestionnaire
    ),
):

    obtenir_programme_actif(
        programme_id,
        db,
    )

    declamation = (
        db.query(Declamation)
        .filter(
            Declamation.id == declamation_id,
            Declamation.programme_id == programme_id,
            Declamation.actif.is_(True),
        )
        .first()
    )

    if not declamation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Déclamation introuvable.",
        )

    declamation.actif = False

    try:
        db.commit()

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Impossible de supprimer la déclamation.",
        )

    return {
        "message": "Déclamation supprimée avec succès."
    }