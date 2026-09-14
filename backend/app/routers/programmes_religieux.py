from calendar import monthrange
from datetime import date, time

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from pydantic import BaseModel

from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import (
    require_permission,
    require_kourel_gestionnaire,
)

from app.models.programme_mensuel import ProgrammeMensuel
from app.models.repetition import Repetition
from app.models.repetition_khassida import RepetitionKhassida
from app.models.declamation import Declamation
from app.models.declamation_khassida import DeclamationKhassida
from app.models.khassida import Khassida
from app.models.khassida_ton import KhassidaTon
from app.models.ton import Ton
from app.models.audio import Audio


router = APIRouter(
    prefix="/programmes-religieux",
    tags=["Programmes religieux"],
)


# ============================================================
# SCHEMAS
# ============================================================

class AjouterKhassidaRepetitionRequest(BaseModel):
    khassida_id: int
    ton_id: int
    audio_id: int
    ordre: int | None = None


class AjouterKhassidaDeclamationRequest(BaseModel):
    khassida_id: int
    ton_id: int
    audio_id: int | None = None
    ordre: int | None = None


# ============================================================
# UTILITAIRES
# ============================================================

def nettoyer_texte(
    valeur: str | None,
) -> str | None:

    if valeur is None:
        return None

    valeur = valeur.strip()

    return valeur if valeur else None


def construire_khassida(
    khassida: Khassida,
):
    return {
        "id": khassida.id,
        "titre": khassida.titre,
        "auteur": khassida.auteur,
        "description": khassida.description,
        "pdf_url": khassida.pdf_url,
    }


def construire_ton(
    ton: Ton,
):
    return {
        "id": ton.id,
        "nom": ton.nom,
    }


def construire_audio(
    audio: Audio,
):
    return {
        "id": audio.id,
        "titre": audio.titre,
        "fichier": audio.fichier,
        "description": audio.description,
        "actif": audio.actif,
        "ton_id": audio.ton_id,
    }


def obtenir_programme_actif(
    programme_id: int,
    db: Session,
):

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


def obtenir_repetition_active(
    programme_id: int,
    repetition_id: int,
    db: Session,
):

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

    return repetition


def obtenir_declamation_active(
    programme_id: int,
    declamation_id: int,
    db: Session,
):

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

    return declamation


def obtenir_repetition_khassida_active(
    programme_id: int,
    repetition_id: int,
    repetition_khassida_id: int,
    db: Session,
):

    obtenir_repetition_active(
        programme_id,
        repetition_id,
        db,
    )

    liaison = (
        db.query(RepetitionKhassida)
        .filter(
            RepetitionKhassida.id
            == repetition_khassida_id,
            RepetitionKhassida.repetition_id
            == repetition_id,
            RepetitionKhassida.actif.is_(True),
        )
        .first()
    )

    if not liaison:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Khassida de répétition introuvable.",
        )

    return liaison


def obtenir_declamation_khassida_active(
    programme_id: int,
    declamation_id: int,
    declamation_khassida_id: int,
    db: Session,
):

    obtenir_declamation_active(
        programme_id,
        declamation_id,
        db,
    )

    liaison = (
        db.query(DeclamationKhassida)
        .filter(
            DeclamationKhassida.id
            == declamation_khassida_id,
            DeclamationKhassida.declamation_id
            == declamation_id,
            DeclamationKhassida.actif.is_(True),
        )
        .first()
    )

    if not liaison:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Khassida de déclamation introuvable.",
        )

    return liaison


def obtenir_khassida_ton(
    khassida_id: int,
    ton_id: int,
    db: Session,
):

    liaison = (
        db.query(KhassidaTon)
        .filter(
            KhassidaTon.khassida_id == khassida_id,
            KhassidaTon.ton_id == ton_id,
        )
        .first()
    )

    if not liaison:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Ce Ton n'est pas associé "
                "à cette Khassida."
            ),
        )

    return liaison


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


# ============================================================
# LISTER LES PROGRAMMES
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
# CREER UN PROGRAMME
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

    if mois < 1 or mois > 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Le mois doit être compris "
                "entre 1 et 12."
            ),
        )

    if annee < 2000 or annee > 2100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="L'année est invalide.",
        )

    programme_existant = (
        db.query(ProgrammeMensuel)
        .filter(
            ProgrammeMensuel.kourel_id
            == kourel_id,
            ProgrammeMensuel.annee
            == annee,
            ProgrammeMensuel.mois
            == mois,
            ProgrammeMensuel.actif.is_(True),
        )
        .first()
    )

    if programme_existant:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Le programme de ce mois existe "
                "déjà pour ce Kourel."
            ),
        )

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
        "message": (
            "Programme religieux créé "
            "avec succès."
        ),
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

    repetitions = (
        db.query(Repetition)
        .filter(
            Repetition.programme_id
            == programme_id,
            Repetition.actif.is_(True),
        )
        .order_by(
            Repetition.date_repetition.asc(),
            Repetition.id.asc(),
        )
        .all()
    )

    repetitions_data = []

    for repetition in repetitions:

        choix_repetition = (
            db.query(
                RepetitionKhassida,
                Khassida,
                Audio,
                Ton,
            )
            .join(
                Khassida,
                Khassida.id
                == RepetitionKhassida.khassida_id,
            )
            .join(
                Audio,
                Audio.id
                == RepetitionKhassida.audio_id,
            )
            .join(
                Ton,
                Ton.id
                == Audio.ton_id,
            )
            .filter(
                RepetitionKhassida.repetition_id
                == repetition.id,
                RepetitionKhassida.actif.is_(True),
                Khassida.actif.is_(True),
                Audio.actif.is_(True),
                Ton.actif.is_(True),
            )
            .order_by(
                RepetitionKhassida.ordre.asc(),
                RepetitionKhassida.id.asc(),
            )
            .all()
        )

        khassidas = [
            {
                "id": choix.id,
                "ordre": choix.ordre,
                "khassida": construire_khassida(
                    khassida
                ),
                "ton": construire_ton(
                    ton
                ),
                "audio": construire_audio(
                    audio
                ),
            }
            for (
                choix,
                khassida,
                audio,
                ton,
            ) in choix_repetition
        ]

        repetitions_data.append(
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
                "ordre":
                    getattr(
                        repetition,
                        "ordre",
                        None,
                    ),
                "actif":
                    repetition.actif,
                "khassidas":
                    khassidas,
            }
        )

    declamations = (
        db.query(Declamation)
        .filter(
            Declamation.programme_id
            == programme_id,
            Declamation.actif.is_(True),
        )
        .order_by(
            Declamation.date_declamation.asc(),
            Declamation.id.asc(),
        )
        .all()
    )

    declamations_data = []

    for declamation in declamations:

        choix = (
            db.query(
                DeclamationKhassida,
                Khassida,
                Ton,
                Audio,
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
            .outerjoin(
                Audio,
                Audio.id
                == DeclamationKhassida.audio_id,
            )
            .filter(
                DeclamationKhassida.declamation_id
                == declamation.id,
                DeclamationKhassida.actif.is_(True),
                Khassida.actif.is_(True),
                Ton.actif.is_(True),
            )
            .order_by(
                DeclamationKhassida.ordre.asc(),
                DeclamationKhassida.id.asc(),
            )
            .all()
        )

        khassidas = []

        for (
            liaison,
            khassida,
            ton,
            audio,
        ) in choix:

            khassidas.append(
                {
                    "id": liaison.id,
                    "ordre": liaison.ordre,
                    "khassida":
                        construire_khassida(
                            khassida
                        ),
                    "ton":
                        construire_ton(
                            ton
                        ),
                    "audio": (
                        construire_audio(audio)
                        if audio
                        else None
                    ),
                }
            )

        declamations_data.append(
            {
                "id": declamation.id,
                "programme_id":
                    declamation.programme_id,
                "date_declamation":
                    declamation.date_declamation,
                "date_declamaion":
                    declamation.date_declamation,
                "heure_debut":
                    getattr(
                        declamation,
                        "heure_debut",
                        None,
                    ),
                "heure_fin":
                    getattr(
                        declamation,
                        "heure_fin",
                        None,
                    ),
                "heure":
                    getattr(
                        declamation,
                        "heure",
                        None,
                    ),
                "lieu":
                    declamation.lieu,
                "evenement":
                    getattr(
                        declamation,
                        "evenement",
                        None,
                    ),
                "ordre":
                    getattr(
                        declamation,
                        "ordre",
                        None,
                    ),
                "actif":
                    declamation.actif,
                "khassidas":
                    khassidas,
            }
        )

    return {
        "id": programme.id,
        "kourel_id": programme.kourel_id,
        "annee": programme.annee,
        "mois": programme.mois,
        "date_debut": programme.date_debut,
        "date_fin": programme.date_fin,
        "actif": programme.actif,
        "repetitions": repetitions_data,
        "declamations": declamations_data,
    }


# ============================================================
# MODIFIER PROGRAMME
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

    if nouveau_mois < 1 or nouveau_mois > 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Le mois doit être compris "
                "entre 1 et 12."
            ),
        )

    if nouvelle_annee < 2000 or nouvelle_annee > 2100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="L'année est invalide.",
        )

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
# SUPPRIMER PROGRAMME
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
# GENERER REPETITIONS
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
            Repetition.programme_id
            == programme_id,
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

        # Jeudi
        if jour_date.weekday() == 3:

            repetition = Repetition(
                programme_id=programme_id,
                date_repetition=jour_date,
                actif=True,
            )

            db.add(repetition)

            repetitions.append(
                repetition
            )

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
            "programme_id":
                repetition.programme_id,
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
            "khassidas": [],
        }
        for repetition in repetitions
    ]


# ============================================================
# LISTER REPETITIONS
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
            Repetition.programme_id
            == programme_id,
            Repetition.actif.is_(True),
        )
        .order_by(
            Repetition.date_repetition.asc(),
            Repetition.id.asc(),
        )
        .all()
    )

    resultats = []

    for repetition in repetitions:

        choix = (
            db.query(
                RepetitionKhassida,
                Khassida,
                Audio,
                Ton,
            )
            .join(
                Khassida,
                Khassida.id
                == RepetitionKhassida.khassida_id,
            )
            .join(
                Audio,
                Audio.id
                == RepetitionKhassida.audio_id,
            )
            .join(
                Ton,
                Ton.id
                == Audio.ton_id,
            )
            .filter(
                RepetitionKhassida.repetition_id
                == repetition.id,
                RepetitionKhassida.actif.is_(True),
                Khassida.actif.is_(True),
                Audio.actif.is_(True),
                Ton.actif.is_(True),
            )
            .order_by(
                RepetitionKhassida.ordre.asc()
            )
            .all()
        )

        khassidas = [
            {
                "id": liaison.id,
                "ordre": liaison.ordre,
                "khassida":
                    construire_khassida(
                        khassida
                    ),
                "ton":
                    construire_ton(
                        ton
                    ),
                "audio":
                    construire_audio(
                        audio
                    ),
            }
            for (
                liaison,
                khassida,
                audio,
                ton,
            ) in choix
        ]

        resultats.append(
            {
                "id": repetition.id,
                "programme_id":
                    repetition.programme_id,
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
                "ordre":
                    getattr(
                        repetition,
                        "ordre",
                        None,
                    ),
                "actif":
                    repetition.actif,
                "khassidas":
                    khassidas,
            }
        )

    return resultats


# ============================================================
# AJOUTER REPETITION
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

    verifier_date_dans_programme(
        programme,
        date_repetition,
    )

    verifier_heures(
        heure_debut,
        heure_fin,
    )

    repetition_existante = (
        db.query(Repetition)
        .filter(
            Repetition.programme_id
            == programme_id,
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
        "message":
            "Répétition ajoutée avec succès.",
        "id":
            repetition.id,
        "programme_id":
            repetition.programme_id,
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
        "khassidas": [],
    }


# ============================================================
# MODIFIER REPETITION
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

    repetition = obtenir_repetition_active(
        programme_id,
        repetition_id,
        db,
    )

    nouvelle_date = (
        date_repetition
        if date_repetition is not None
        else repetition.date_repetition
    )

    verifier_date_dans_programme(
        programme,
        nouvelle_date,
    )

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

    if date_repetition is not None:

        doublon = (
            db.query(Repetition)
            .filter(
                Repetition.programme_id
                == programme_id,
                Repetition.date_repetition
                == date_repetition,
                Repetition.id
                != repetition_id,
                Repetition.actif.is_(True),
            )
            .first()
        )

        if doublon:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Une autre répétition existe "
                    "déjà à cette date."
                ),
            )

    repetition.date_repetition = (
        nouvelle_date
    )

    repetition.heure_debut = (
        nouvelle_heure_debut
    )

    repetition.heure_fin = (
        nouvelle_heure_fin
    )

    if lieu is not None:
        repetition.lieu = nettoyer_texte(
            lieu
        )

    try:
        db.commit()
        db.refresh(repetition)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Impossible de modifier "
                "la répétition."
            ),
        )

    return {
        "message":
            "Répétition modifiée avec succès.",
        "id":
            repetition.id,
        "programme_id":
            repetition.programme_id,
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


# ============================================================
# SUPPRIMER REPETITION
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

    repetition = obtenir_repetition_active(
        programme_id,
        repetition_id,
        db,
    )

    repetition.actif = False

    try:
        db.commit()

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Impossible de supprimer "
                "la répétition."
            ),
        )

    return {
        "message":
            "Répétition supprimée avec succès."
    }


# ============================================================
# LISTER KHASSIDAS D'UNE REPETITION
# ============================================================

@router.get(
    "/{programme_id}/repetitions/{repetition_id}/khassidas"
)
def lister_khassidas_repetition(
    programme_id: int,
    repetition_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CONSULTER")
    ),
):

    repetition = obtenir_repetition_active(
        programme_id,
        repetition_id,
        db,
    )

    choix = (
        db.query(
            RepetitionKhassida,
            Khassida,
            Audio,
            Ton,
        )
        .join(
            Khassida,
            Khassida.id
            == RepetitionKhassida.khassida_id,
        )
        .join(
            Audio,
            Audio.id
            == RepetitionKhassida.audio_id,
        )
        .join(
            Ton,
            Ton.id
            == Audio.ton_id,
        )
        .filter(
            RepetitionKhassida.repetition_id
            == repetition.id,
            RepetitionKhassida.actif.is_(True),
            Khassida.actif.is_(True),
            Audio.actif.is_(True),
            Ton.actif.is_(True),
        )
        .order_by(
            RepetitionKhassida.ordre.asc(),
            RepetitionKhassida.id.asc(),
        )
        .all()
    )

    return [
        {
            "id": liaison.id,
            "ordre": liaison.ordre,
            "khassida":
                construire_khassida(
                    khassida
                ),
            "ton":
                construire_ton(
                    ton
                ),
            "audio":
                construire_audio(
                    audio
                ),
        }
        for (
            liaison,
            khassida,
            audio,
            ton,
        ) in choix
    ]


# ============================================================
# TONS D'UNE KHASSIDA DANS UNE REPETITION
# ============================================================

@router.get(
    "/{programme_id}/repetitions/{repetition_id}/khassidas/{khassida_id}/tons"
)
def lister_tons_pour_khassida(
    programme_id: int,
    repetition_id: int,
    khassida_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CONSULTER")
    ),
):

    obtenir_repetition_active(
        programme_id,
        repetition_id,
        db,
    )

    khassida = (
        db.query(Khassida)
        .filter(
            Khassida.id == khassida_id,
            Khassida.actif.is_(True),
        )
        .first()
    )

    if not khassida:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Khassida introuvable.",
        )

    tons = (
        db.query(Ton)
        .join(
            KhassidaTon,
            KhassidaTon.ton_id == Ton.id,
        )
        .filter(
            KhassidaTon.khassida_id
            == khassida_id,
            Ton.actif.is_(True),
        )
        .distinct()
        .order_by(
            Ton.nom.asc()
        )
        .all()
    )

    return [
        construire_ton(ton)
        for ton in tons
    ]


# ============================================================
# AUDIOS D'UNE KHASSIDA + TON
# ============================================================

@router.get(
    "/{programme_id}/repetitions/{repetition_id}/khassidas/{khassida_id}/tons/{ton_id}/audios"
)
def lister_audios_pour_khassida_ton(
    programme_id: int,
    repetition_id: int,
    khassida_id: int,
    ton_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CONSULTER")
    ),
):

    obtenir_repetition_active(
        programme_id,
        repetition_id,
        db,
    )

    khassida = (
        db.query(Khassida)
        .filter(
            Khassida.id == khassida_id,
            Khassida.actif.is_(True),
        )
        .first()
    )

    if not khassida:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Khassida introuvable.",
        )

    ton = (
        db.query(Ton)
        .filter(
            Ton.id == ton_id,
            Ton.actif.is_(True),
        )
        .first()
    )

    if not ton:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ton introuvable.",
        )

    obtenir_khassida_ton(
        khassida_id,
        ton_id,
        db,
    )

    audios = (
        db.query(Audio)
        .filter(
            Audio.khassida_id == khassida_id,
            Audio.ton_id == ton_id,
            Audio.actif.is_(True),
        )
        .order_by(
            Audio.titre.asc(),
            Audio.id.asc(),
        )
        .all()
    )

    return [
        construire_audio(audio)
        for audio in audios
    ]


# ============================================================
# AJOUTER KHASSIDA À UNE REPETITION
#
# IMPORTANT :
# Les valeurs viennent maintenant du BODY JSON.
# ============================================================

@router.post(
    "/{programme_id}/repetitions/{repetition_id}/khassidas",
    status_code=status.HTTP_201_CREATED,
)
def ajouter_khassida_repetition(
    programme_id: int,
    repetition_id: int,
    data: AjouterKhassidaRepetitionRequest,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_kourel_gestionnaire
    ),
):

    repetition = obtenir_repetition_active(
        programme_id,
        repetition_id,
        db,
    )

    khassida = (
        db.query(Khassida)
        .filter(
            Khassida.id == data.khassida_id,
            Khassida.actif.is_(True),
        )
        .first()
    )

    if not khassida:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Khassida introuvable.",
        )

    ton = (
        db.query(Ton)
        .filter(
            Ton.id == data.ton_id,
            Ton.actif.is_(True),
        )
        .first()
    )

    if not ton:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ton introuvable.",
        )

    obtenir_khassida_ton(
        data.khassida_id,
        data.ton_id,
        db,
    )

    audio = (
        db.query(Audio)
        .filter(
            Audio.id == data.audio_id,
            Audio.khassida_id
            == data.khassida_id,
            Audio.ton_id == data.ton_id,
            Audio.actif.is_(True),
        )
        .first()
    )

    if not audio:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Cet audio ne correspond pas "
                "à la Khassida et au Ton sélectionnés."
            ),
        )

    deja_present = (
        db.query(RepetitionKhassida)
        .filter(
            RepetitionKhassida.repetition_id
            == repetition.id,
            RepetitionKhassida.khassida_id
            == data.khassida_id,
            RepetitionKhassida.audio_id
            == data.audio_id,
            RepetitionKhassida.actif.is_(True),
        )
        .first()
    )

    if deja_present:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Cette Khassida avec cet audio "
                "est déjà ajoutée à cette répétition."
            ),
        )

    ordre = data.ordre

    if ordre is None:

        dernier_ordre = (
            db.query(
                RepetitionKhassida.ordre
            )
            .filter(
                RepetitionKhassida.repetition_id
                == repetition.id,
                RepetitionKhassida.actif.is_(True),
            )
            .order_by(
                RepetitionKhassida.ordre.desc()
            )
            .first()
        )

        ordre = (
            dernier_ordre[0] + 1
            if dernier_ordre
            else 1
        )

    if ordre < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "L'ordre doit être supérieur "
                "ou égal à 1."
            ),
        )

    ordre_existant = (
        db.query(RepetitionKhassida)
        .filter(
            RepetitionKhassida.repetition_id
            == repetition.id,
            RepetitionKhassida.ordre == ordre,
            RepetitionKhassida.actif.is_(True),
        )
        .first()
    )

    if ordre_existant:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Cet ordre est déjà utilisé "
                "dans cette répétition."
            ),
        )

    ancienne_liaison = (
        db.query(RepetitionKhassida)
        .filter(
            RepetitionKhassida.repetition_id
            == repetition.id,
            RepetitionKhassida.khassida_id
            == data.khassida_id,
            RepetitionKhassida.actif.is_(False),
        )
        .order_by(
            RepetitionKhassida.id.desc()
        )
        .first()
    )

    if ancienne_liaison:

        ancienne_liaison.audio_id = (
            data.audio_id
        )

        ancienne_liaison.ordre = ordre

        ancienne_liaison.actif = True

        try:
            db.commit()
            db.refresh(
                ancienne_liaison
            )

        except Exception:
            db.rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=(
                    "Impossible de réactiver "
                    "la Khassida."
                ),
            )

        return {
            "message":
                "Khassida ajoutée à la répétition.",
            "id":
                ancienne_liaison.id,
            "ordre":
                ancienne_liaison.ordre,
            "khassida":
                construire_khassida(
                    khassida
                ),
            "ton":
                construire_ton(
                    ton
                ),
            "audio":
                construire_audio(
                    audio
                ),
        }

    choix = RepetitionKhassida(
        repetition_id=repetition.id,
        khassida_id=data.khassida_id,
        audio_id=data.audio_id,
        ordre=ordre,
        actif=True,
    )

    db.add(choix)

    try:
        db.commit()
        db.refresh(choix)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Impossible d'ajouter la Khassida "
                "à la répétition."
            ),
        )

    return {
        "message":
            "Khassida ajoutée à la répétition.",
        "id":
            choix.id,
        "ordre":
            choix.ordre,
        "khassida":
            construire_khassida(
                khassida
            ),
        "ton":
            construire_ton(
                ton
            ),
        "audio":
            construire_audio(
                audio
            ),
    }


# ============================================================
# MODIFIER KHASSIDA REPETITION
# ============================================================

@router.put(
    "/{programme_id}/repetitions/{repetition_id}/khassidas/{repetition_khassida_id}"
)
def modifier_khassida_repetition(
    programme_id: int,
    repetition_id: int,
    repetition_khassida_id: int,
    ton_id: int | None = None,
    audio_id: int | None = None,
    ordre: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_kourel_gestionnaire
    ),
):

    choix = obtenir_repetition_khassida_active(
        programme_id,
        repetition_id,
        repetition_khassida_id,
        db,
    )

    audio_actuel = (
        db.query(Audio)
        .filter(
            Audio.id == choix.audio_id,
        )
        .first()
    )

    if not audio_actuel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio actuel introuvable.",
        )

    nouveau_ton_id = (
        ton_id
        if ton_id is not None
        else audio_actuel.ton_id
    )

    obtenir_khassida_ton(
        choix.khassida_id,
        nouveau_ton_id,
        db,
    )

    nouvel_audio_id = (
        audio_id
        if audio_id is not None
        else choix.audio_id
    )

    audio = (
        db.query(Audio)
        .filter(
            Audio.id == nouvel_audio_id,
            Audio.khassida_id
            == choix.khassida_id,
            Audio.ton_id == nouveau_ton_id,
            Audio.actif.is_(True),
        )
        .first()
    )

    if not audio:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "L'audio sélectionné ne correspond "
                "pas à la Khassida et au Ton."
            ),
        )

    if ordre is not None:

        if ordre < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "L'ordre doit être supérieur "
                    "ou égal à 1."
                ),
            )

        ordre_existant = (
            db.query(RepetitionKhassida)
            .filter(
                RepetitionKhassida.repetition_id
                == repetition_id,
                RepetitionKhassida.ordre
                == ordre,
                RepetitionKhassida.id
                != repetition_khassida_id,
                RepetitionKhassida.actif.is_(True),
            )
            .first()
        )

        if ordre_existant:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Cet ordre est déjà utilisé "
                    "dans cette répétition."
                ),
            )

        choix.ordre = ordre

    choix.audio_id = audio.id

    try:
        db.commit()
        db.refresh(choix)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Impossible de modifier "
                "la Khassida."
            ),
        )

    ton = (
        db.query(Ton)
        .filter(
            Ton.id == audio.ton_id
        )
        .first()
    )

    khassida = (
        db.query(Khassida)
        .filter(
            Khassida.id
            == choix.khassida_id
        )
        .first()
    )

    return {
        "message":
            "Khassida de répétition modifiée.",
        "id":
            choix.id,
        "ordre":
            choix.ordre,
        "khassida_id":
            choix.khassida_id,
        "ton_id":
            audio.ton_id,
        "khassida":
            (
                construire_khassida(
                    khassida
                )
                if khassida
                else None
            ),
        "ton":
            (
                construire_ton(ton)
                if ton
                else None
            ),
        "audio":
            construire_audio(
                audio
            ),
    }


# ============================================================
# SUPPRIMER KHASSIDA REPETITION
# ============================================================

@router.delete(
    "/{programme_id}/repetitions/{repetition_id}/khassidas/{repetition_khassida_id}"
)
def supprimer_khassida_repetition(
    programme_id: int,
    repetition_id: int,
    repetition_khassida_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_kourel_gestionnaire
    ),
):

    choix = obtenir_repetition_khassida_active(
        programme_id,
        repetition_id,
        repetition_khassida_id,
        db,
    )

    choix.actif = False

    try:
        db.commit()

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Impossible de retirer "
                "la Khassida."
            ),
        )

    return {
        "message":
            "Khassida retirée de la répétition."
    }


# ============================================================
# LISTER DECLAMATIONS
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
            Declamation.programme_id
            == programme_id,
            Declamation.actif.is_(True),
        )
        .order_by(
            Declamation.date_declamation.asc(),
            Declamation.id.asc(),
        )
        .all()
    )

    resultats = []

    for declamation in declamations:

        choix = (
            db.query(
                DeclamationKhassida,
                Khassida,
                Ton,
                Audio,
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
            .outerjoin(
                Audio,
                Audio.id
                == DeclamationKhassida.audio_id,
            )
            .filter(
                DeclamationKhassida.declamation_id
                == declamation.id,
                DeclamationKhassida.actif.is_(True),
                Khassida.actif.is_(True),
                Ton.actif.is_(True),
            )
            .order_by(
                DeclamationKhassida.ordre.asc(),
                DeclamationKhassida.id.asc(),
            )
            .all()
        )

        khassidas = [
            {
                "id": liaison.id,
                "ordre": liaison.ordre,
                "khassida":
                    construire_khassida(
                        khassida
                    ),
                "ton":
                    construire_ton(
                        ton
                    ),
                "audio": (
                    construire_audio(audio)
                    if audio
                    else None
                ),
            }
            for (
                liaison,
                khassida,
                ton,
                audio,
            ) in choix
        ]

        resultats.append(
            {
                "id": declamation.id,
                "programme_id":
                    declamation.programme_id,
                "date_declamation":
                    declamation.date_declamation,
                "date":
                    declamation.date_declamation,
                "heure":
                    getattr(
                        declamation,
                        "heure",
                        None,
                    ),
                "heure_debut":
                    getattr(
                        declamation,
                        "heure_debut",
                        None,
                    ),
                "heure_fin":
                    getattr(
                        declamation,
                        "heure_fin",
                        None,
                    ),
                "lieu":
                    declamation.lieu,
                "evenement":
                    getattr(
                        declamation,
                        "evenement",
                        None,
                    ),
                "ordre":
                    getattr(
                        declamation,
                        "ordre",
                        None,
                    ),
                "actif":
                    declamation.actif,
                "khassidas":
                    khassidas,
            }
        )

    return resultats


# ============================================================
# AJOUTER DECLAMATION
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

    verifier_date_dans_programme(
        programme,
        date_declamation,
    )

    evenement = evenement.strip()

    if not evenement:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="L'événement est obligatoire.",
        )

    declamation_existante = (
        db.query(Declamation)
        .filter(
            Declamation.programme_id
            == programme_id,
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
            detail=(
                "Impossible d'ajouter "
                "la déclamation."
            ),
        )

    return {
        "message":
            "Événement ajouté avec succès.",
        "id":
            declamation.id,
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
        "khassidas": [],
    }


# ============================================================
# MODIFIER DECLAMATION
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

    declamation = obtenir_declamation_active(
        programme_id,
        declamation_id,
        db,
    )

    if date_declamation is not None:

        verifier_date_dans_programme(
            programme,
            date_declamation,
        )

        declamation.date_declamation = (
            date_declamation
        )

    if evenement is not None:

        evenement = evenement.strip()

        if not evenement:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "L'événement est obligatoire."
                ),
            )

        declamation.evenement = evenement

    if heure is not None:
        declamation.heure = heure

    if lieu is not None:
        declamation.lieu = nettoyer_texte(
            lieu
        )

    try:
        db.commit()
        db.refresh(declamation)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Impossible de modifier "
                "la déclamation."
            ),
        )

    return {
        "message":
            "Déclamation modifiée avec succès.",
        "id":
            declamation.id,
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


# ============================================================
# SUPPRIMER DECLAMATION
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

    declamation = obtenir_declamation_active(
        programme_id,
        declamation_id,
        db,
    )

    declamation.actif = False

    try:
        db.commit()

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Impossible de supprimer "
                "la déclamation."
            ),
        )

    return {
        "message":
            "Déclamation supprimée avec succès."
    }


# ============================================================
# KHASSIDAS D'UNE DECLAMATION
# ============================================================

@router.get(
    "/{programme_id}/declamations/{declamation_id}/khassidas"
)
def lister_khassidas_declamation(
    programme_id: int,
    declamation_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CONSULTER")
    ),
):

    declamation = obtenir_declamation_active(
        programme_id,
        declamation_id,
        db,
    )

    choix = (
        db.query(
            DeclamationKhassida,
            Khassida,
            Ton,
            Audio,
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
        .outerjoin(
            Audio,
            Audio.id
            == DeclamationKhassida.audio_id,
        )
        .filter(
            DeclamationKhassida.declamation_id
            == declamation.id,
            DeclamationKhassida.actif.is_(True),
            Khassida.actif.is_(True),
            Ton.actif.is_(True),
        )
        .order_by(
            DeclamationKhassida.ordre.asc(),
            DeclamationKhassida.id.asc(),
        )
        .all()
    )

    return [
        {
            "id": liaison.id,
            "ordre": liaison.ordre,
            "khassida":
                construire_khassida(
                    khassida
                ),
            "ton":
                construire_ton(
                    ton
                ),
            "audio": (
                construire_audio(audio)
                if audio
                else None
            ),
        }
        for (
            liaison,
            khassida,
            ton,
            audio,
        ) in choix
    ]


# ============================================================
# TONS DECLAMATION
# ============================================================

@router.get(
    "/{programme_id}/declamations/{declamation_id}/khassidas/{khassida_id}/tons"
)
def lister_tons_declamation_khassida(
    programme_id: int,
    declamation_id: int,
    khassida_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CONSULTER")
    ),
):

    obtenir_declamation_active(
        programme_id,
        declamation_id,
        db,
    )

    khassida = (
        db.query(Khassida)
        .filter(
            Khassida.id == khassida_id,
            Khassida.actif.is_(True),
        )
        .first()
    )

    if not khassida:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Khassida introuvable.",
        )

    tons = (
        db.query(Ton)
        .join(
            KhassidaTon,
            KhassidaTon.ton_id == Ton.id,
        )
        .filter(
            KhassidaTon.khassida_id
            == khassida_id,
            Ton.actif.is_(True),
        )
        .distinct()
        .order_by(
            Ton.nom.asc()
        )
        .all()
    )

    return [
        construire_ton(ton)
        for ton in tons
    ]


# ============================================================
# AUDIOS DECLAMATION
# ============================================================

@router.get(
    "/{programme_id}/declamations/{declamation_id}/khassidas/{khassida_id}/tons/{ton_id}/audios"
)
def lister_audios_declamation_khassida_ton(
    programme_id: int,
    declamation_id: int,
    khassida_id: int,
    ton_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CONSULTER")
    ),
):

    obtenir_declamation_active(
        programme_id,
        declamation_id,
        db,
    )

    khassida = (
        db.query(Khassida)
        .filter(
            Khassida.id == khassida_id,
            Khassida.actif.is_(True),
        )
        .first()
    )

    if not khassida:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Khassida introuvable.",
        )

    ton = (
        db.query(Ton)
        .filter(
            Ton.id == ton_id,
            Ton.actif.is_(True),
        )
        .first()
    )

    if not ton:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ton introuvable.",
        )

    obtenir_khassida_ton(
        khassida_id,
        ton_id,
        db,
    )

    audios = (
        db.query(Audio)
        .filter(
            Audio.khassida_id
            == khassida_id,
            Audio.ton_id == ton_id,
            Audio.actif.is_(True),
        )
        .order_by(
            Audio.titre.asc(),
            Audio.id.asc(),
        )
        .all()
    )

    return [
        construire_audio(audio)
        for audio in audios
    ]


# ============================================================
# AJOUTER KHASSIDA DECLAMATION
# ============================================================

@router.post(
    "/{programme_id}/declamations/{declamation_id}/khassidas",
    status_code=status.HTTP_201_CREATED,
)
def ajouter_khassida_declamation(
    programme_id: int,
    declamation_id: int,
    data: AjouterKhassidaDeclamationRequest,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_kourel_gestionnaire
    ),
):

    declamation = obtenir_declamation_active(
        programme_id,
        declamation_id,
        db,
    )

    khassida = (
        db.query(Khassida)
        .filter(
            Khassida.id
            == data.khassida_id,
            Khassida.actif.is_(True),
        )
        .first()
    )

    if not khassida:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Khassida introuvable.",
        )

    ton = (
        db.query(Ton)
        .filter(
            Ton.id == data.ton_id,
            Ton.actif.is_(True),
        )
        .first()
    )

    if not ton:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ton introuvable.",
        )

    obtenir_khassida_ton(
        data.khassida_id,
        data.ton_id,
        db,
    )

    audio = None

    if data.audio_id is not None:

        audio = (
            db.query(Audio)
            .filter(
                Audio.id == data.audio_id,
                Audio.khassida_id
                == data.khassida_id,
                Audio.ton_id
                == data.ton_id,
                Audio.actif.is_(True),
            )
            .first()
        )

        if not audio:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Cet audio ne correspond pas "
                    "à la Khassida et au Ton."
                ),
            )

    ordre = data.ordre

    if ordre is None:

        dernier_ordre = (
            db.query(
                DeclamationKhassida.ordre
            )
            .filter(
                DeclamationKhassida.declamation_id
                == declamation.id,
                DeclamationKhassida.actif.is_(True),
            )
            .order_by(
                DeclamationKhassida.ordre.desc()
            )
            .first()
        )

        ordre = (
            dernier_ordre[0] + 1
            if dernier_ordre
            else 1
        )

    if ordre < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "L'ordre doit être supérieur "
                "ou égal à 1."
            ),
        )

    deja_present = (
        db.query(DeclamationKhassida)
        .filter(
            DeclamationKhassida.declamation_id
            == declamation.id,
            DeclamationKhassida.khassida_id
            == data.khassida_id,
            DeclamationKhassida.actif.is_(True),
        )
        .first()
    )

    if deja_present:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Cette Khassida est déjà ajoutée "
                "à cette déclamation."
            ),
        )

    liaison = DeclamationKhassida(
        declamation_id=declamation.id,
        khassida_id=data.khassida_id,
        ton_id=data.ton_id,
        audio_id=(
            audio.id
            if audio
            else None
        ),
        ordre=ordre,
        actif=True,
    )

    db.add(liaison)

    try:
        db.commit()
        db.refresh(liaison)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Impossible d'ajouter "
                "la Khassida à la déclamation."
            ),
        )

    return {
        "message":
            "Khassida ajoutée à la déclamation.",
        "id":
            liaison.id,
        "ordre":
            liaison.ordre,
        "khassida":
            construire_khassida(
                khassida
            ),
        "ton":
            construire_ton(
                ton
            ),
        "audio": (
            construire_audio(audio)
            if audio
            else None
        ),
    }


# ============================================================
# MODIFIER KHASSIDA DECLAMATION
# ============================================================

@router.put(
    "/{programme_id}/declamations/{declamation_id}/khassidas/{declamation_khassida_id}"
)
def modifier_khassida_declamation(
    programme_id: int,
    declamation_id: int,
    declamation_khassida_id: int,
    ton_id: int | None = None,
    audio_id: int | None = None,
    ordre: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_kourel_gestionnaire
    ),
):

    choix = obtenir_declamation_khassida_active(
        programme_id,
        declamation_id,
        declamation_khassida_id,
        db,
    )

    nouveau_ton_id = (
        ton_id
        if ton_id is not None
        else choix.ton_id
    )

    obtenir_khassida_ton(
        choix.khassida_id,
        nouveau_ton_id,
        db,
    )

    audio = None

    if audio_id is not None:

        audio = (
            db.query(Audio)
            .filter(
                Audio.id == audio_id,
                Audio.khassida_id
                == choix.khassida_id,
                Audio.ton_id
                == nouveau_ton_id,
                Audio.actif.is_(True),
            )
            .first()
        )

        if not audio:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "L'audio sélectionné ne correspond "
                    "pas à la Khassida et au Ton."
                ),
            )

    if ordre is not None:

        if ordre < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "L'ordre doit être supérieur "
                    "ou égal à 1."
                ),
            )

        ordre_existant = (
            db.query(
                DeclamationKhassida
            )
            .filter(
                DeclamationKhassida.declamation_id
                == declamation_id,
                DeclamationKhassida.ordre
                == ordre,
                DeclamationKhassida.id
                != declamation_khassida_id,
                DeclamationKhassida.actif.is_(True),
            )
            .first()
        )

        if ordre_existant:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Cet ordre est déjà utilisé "
                    "dans cette déclamation."
                ),
            )

        choix.ordre = ordre

    choix.ton_id = nouveau_ton_id

    if audio_id is not None:
        choix.audio_id = audio.id

    try:
        db.commit()
        db.refresh(choix)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Impossible de modifier "
                "la Khassida."
            ),
        )

    khassida = (
        db.query(Khassida)
        .filter(
            Khassida.id
            == choix.khassida_id
        )
        .first()
    )

    ton = (
        db.query(Ton)
        .filter(
            Ton.id
            == choix.ton_id
        )
        .first()
    )

    if choix.audio_id:
        audio = (
            db.query(Audio)
            .filter(
                Audio.id
                == choix.audio_id
            )
            .first()
        )

    return {
        "message":
            "Khassida de déclamation modifiée.",
        "id":
            choix.id,
        "ordre":
            choix.ordre,
        "khassida_id":
            choix.khassida_id,
        "ton_id":
            choix.ton_id,
        "khassida": (
            construire_khassida(
                khassida
            )
            if khassida
            else None
        ),
        "ton": (
            construire_ton(
                ton
            )
            if ton
            else None
        ),
        "audio": (
            construire_audio(audio)
            if audio
            else None
        ),
    }


# ============================================================
# SUPPRIMER KHASSIDA DECLAMATION
# ============================================================

@router.delete(
    "/{programme_id}/declamations/{declamation_id}/khassidas/{declamation_khassida_id}"
)
def supprimer_khassida_declamation(
    programme_id: int,
    declamation_id: int,
    declamation_khassida_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_kourel_gestionnaire
    ),
):

    choix = obtenir_declamation_khassida_active(
        programme_id,
        declamation_id,
        declamation_khassida_id,
        db,
    )

    choix.actif = False

    try:
        db.commit()

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Impossible de retirer "
                "la Khassida."
            ),
        )

    return {
        "message":
            "Khassida retirée de la déclamation."
    }