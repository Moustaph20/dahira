from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import require_permission

from app.models.repetition import Repetition
from app.models.repetition_khassida import RepetitionKhassida
from app.models.programme_mensuel import ProgrammeMensuel
from app.models.khassida import Khassida
from app.models.audio import Audio
from app.models.ton import Ton

from app.schemas.repetition import (
    RepetitionCreate,
    RepetitionResponse,
    RepetitionUpdate,
)

from app.schemas.repetition_khassida import (
    RepetitionKhassidaCreate,
    RepetitionKhassidaResponse,
)

from app.schemas.repetition_detail import (
    RepetitionDetailResponse,
    KhassidaRepetitionResponse,
    AudioRepetitionResponse,
    TonRepetitionResponse,
)


router = APIRouter(
    prefix="/repetitions",
    tags=["Kourel - Répétitions"],
)


# ============================================================
# LISTE DES RÉPÉTITIONS
# ============================================================

@router.get(
    "",
    response_model=list[RepetitionResponse]
)
def lister_repetitions(
    programme_id: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CONSULTER")
    ),
):

    query = (
        db.query(Repetition)
        .filter(
            Repetition.actif.is_(True)
        )
    )

    if programme_id is not None:

        query = query.filter(
            Repetition.programme_id
            == programme_id
        )

    return (
        query
        .order_by(
            Repetition.date_repetition.asc()
        )
        .all()
    )


# ============================================================
# DÉTAIL D'UNE RÉPÉTITION
# ============================================================

@router.get(
    "/{repetition_id}",
    response_model=RepetitionDetailResponse
)
def obtenir_repetition(
    repetition_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CONSULTER")
    ),
):

    repetition = (
        db.query(Repetition)
        .filter(
            Repetition.id == repetition_id,
            Repetition.actif.is_(True)
        )
        .first()
    )

    if not repetition:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Répétition introuvable."
        )

    lignes = (
        db.query(
            RepetitionKhassida,
            Khassida
        )
        .join(
            Khassida,
            Khassida.id
            == RepetitionKhassida.khassida_id
        )
        .filter(
            RepetitionKhassida.repetition_id
            == repetition_id,
            RepetitionKhassida.actif.is_(True),
            Khassida.actif.is_(True)
        )
        .order_by(
            RepetitionKhassida.ordre.asc()
        )
        .all()
    )

    khassidas = []

    for liaison, khassida in lignes:

        audio_rows = (
            db.query(
                Audio,
                Ton
            )
            .join(
                Ton,
                Ton.id == Audio.ton_id
            )
            .filter(
                Audio.khassida_id
                == khassida.id,

                Audio.actif.is_(True),

                Ton.actif.is_(True)
            )
            .order_by(
                Audio.titre.asc()
            )
            .all()
        )

        audios = []

        for audio, ton in audio_rows:

            audios.append(
                AudioRepetitionResponse(
                    id=audio.id,
                    titre=audio.titre,
                    fichier=audio.fichier,
                    description=audio.description,
                    ton=TonRepetitionResponse(
                        id=ton.id,
                        nom=ton.nom,
                        description=ton.description
                    )
                )
            )

        khassidas.append(
            KhassidaRepetitionResponse(
                id=khassida.id,
                titre=khassida.titre,
                auteur=khassida.auteur,
                description=khassida.description,
                ordre=liaison.ordre,
                audios=audios
            )
        )

    return RepetitionDetailResponse(
        id=repetition.id,
        programme_id=repetition.programme_id,
        date_repetition=repetition.date_repetition,
        heure_debut=repetition.heure_debut,
        heure_fin=repetition.heure_fin,
        lieu=repetition.lieu,
        actif=repetition.actif,
        khassidas=khassidas
    )


# ============================================================
# CRÉER UNE RÉPÉTITION
# ============================================================

@router.post(
    "",
    response_model=RepetitionResponse,
    status_code=status.HTTP_201_CREATED
)
def creer_repetition(
    data: RepetitionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CREER")
    ),
):

    programme = (
        db.query(ProgrammeMensuel)
        .filter(
            ProgrammeMensuel.id
            == data.programme_id,

            ProgrammeMensuel.actif.is_(True)
        )
        .first()
    )

    if not programme:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Programme mensuel introuvable."
        )

    if (
        data.date_repetition
        < programme.date_debut
        or data.date_repetition
        > programme.date_fin
    ):

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "La date de répétition doit "
                "être comprise dans le programme mensuel."
            )
        )

    if (
        data.heure_debut
        and data.heure_fin
        and data.heure_fin <= data.heure_debut
    ):

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "L'heure de fin doit être "
                "postérieure à l'heure de début."
            )
        )

    repetition_existante = (
        db.query(Repetition)
        .filter(
            Repetition.programme_id
            == data.programme_id,

            Repetition.date_repetition
            == data.date_repetition,

            Repetition.actif.is_(True)
        )
        .first()
    )

    if repetition_existante:

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Une répétition existe déjà "
                "à cette date pour ce programme."
            )
        )

    repetition = Repetition(
        programme_id=data.programme_id,
        date_repetition=data.date_repetition,
        heure_debut=data.heure_debut,
        heure_fin=data.heure_fin,
        lieu=(
            data.lieu.strip()
            if data.lieu
            else None
        ),
        actif=True
    )

    db.add(repetition)
    db.commit()
    db.refresh(repetition)

    return repetition


# ============================================================
# MODIFIER UNE RÉPÉTITION
# ============================================================

@router.put(
    "/{repetition_id}",
    response_model=RepetitionResponse
)
def modifier_repetition(
    repetition_id: int,
    data: RepetitionUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_MODIFIER")
    ),
):

    repetition = (
        db.query(Repetition)
        .filter(
            Repetition.id == repetition_id,
            Repetition.actif.is_(True)
        )
        .first()
    )

    if not repetition:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Répétition introuvable."
        )

    donnees = data.model_dump(
        exclude_unset=True
    )

    date_repetition = donnees.get(
        "date_repetition",
        repetition.date_repetition
    )

    programme = (
        db.query(ProgrammeMensuel)
        .filter(
            ProgrammeMensuel.id
            == repetition.programme_id,

            ProgrammeMensuel.actif.is_(True)
        )
        .first()
    )

    if programme:

        if (
            date_repetition
            < programme.date_debut
            or date_repetition
            > programme.date_fin
        ):

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "La date de répétition doit "
                    "être comprise dans le programme mensuel."
                )
            )

    heure_debut = donnees.get(
        "heure_debut",
        repetition.heure_debut
    )

    heure_fin = donnees.get(
        "heure_fin",
        repetition.heure_fin
    )

    if (
        heure_debut
        and heure_fin
        and heure_fin <= heure_debut
    ):

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "L'heure de fin doit être "
                "postérieure à l'heure de début."
            )
        )

    if "lieu" in donnees:

        donnees["lieu"] = (
            donnees["lieu"].strip()
            if donnees["lieu"]
            else None
        )

    for champ, valeur in donnees.items():

        setattr(
            repetition,
            champ,
            valeur
        )

    db.commit()
    db.refresh(repetition)

    return repetition


# ============================================================
# SUPPRESSION LOGIQUE
# ============================================================

@router.delete(
    "/{repetition_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def supprimer_repetition(
    repetition_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_SUPPRIMER")
    ),
):

    repetition = (
        db.query(Repetition)
        .filter(
            Repetition.id == repetition_id,
            Repetition.actif.is_(True)
        )
        .first()
    )

    if not repetition:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Répétition introuvable."
        )

    repetition.actif = False

    db.commit()

    return None


# ============================================================
# AJOUTER UNE KHASSIDA À UNE RÉPÉTITION
# ============================================================

@router.post(
    "/{repetition_id}/khassidas",
    response_model=RepetitionKhassidaResponse,
    status_code=status.HTTP_201_CREATED
)
def ajouter_khassida(
    repetition_id: int,
    data: RepetitionKhassidaCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_MODIFIER")
    ),
):

    repetition = (
        db.query(Repetition)
        .filter(
            Repetition.id == repetition_id,
            Repetition.actif.is_(True)
        )
        .first()
    )

    if not repetition:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Répétition introuvable."
        )

    khassida = (
        db.query(Khassida)
        .filter(
            Khassida.id == data.khassida_id,
            Khassida.actif.is_(True)
        )
        .first()
    )

    if not khassida:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Khassida introuvable."
        )

    liaison_existante = (
        db.query(RepetitionKhassida)
        .filter(
            RepetitionKhassida.repetition_id
            == repetition_id,

            RepetitionKhassida.khassida_id
            == data.khassida_id
        )
        .first()
    )

    if liaison_existante:

        if not liaison_existante.actif:

            liaison_existante.actif = True
            liaison_existante.ordre = data.ordre

            db.commit()
            db.refresh(liaison_existante)

            return liaison_existante

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Cette Khassida est déjà associée "
                "à cette répétition."
            )
        )

    liaison = RepetitionKhassida(
        repetition_id=repetition_id,
        khassida_id=data.khassida_id,
        ordre=data.ordre,
        actif=True
    )

    db.add(liaison)
    db.commit()
    db.refresh(liaison)

    return liaison


# ============================================================
# RETIRER UNE KHASSIDA D'UNE RÉPÉTITION
# ============================================================

@router.delete(
    "/{repetition_id}/khassidas/{khassida_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def retirer_khassida(
    repetition_id: int,
    khassida_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_MODIFIER")
    ),
):

    liaison = (
        db.query(RepetitionKhassida)
        .filter(
            RepetitionKhassida.repetition_id
            == repetition_id,

            RepetitionKhassida.khassida_id
            == khassida_id,

            RepetitionKhassida.actif.is_(True)
        )
        .first()
    )

    if not liaison:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "Cette Khassida n'est pas "
                "associée à cette répétition."
            )
        )

    liaison.actif = False

    db.commit()

    return None