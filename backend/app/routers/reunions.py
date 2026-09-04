from datetime import datetime
from typing import Optional
from urllib.parse import parse_qs, unquote, urlparse
from urllib.request import Request, urlopen

import ipaddress
import re
import socket

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import require_permission

from app.models.reunion import Reunion
from app.models.membre import Membre
from app.models.utilisateur import Utilisateur

from app.schemas.reunion import (
    ReunionCompteRenduUpdate,
    ReunionCreate,
    ReunionResponse,
    ReunionStatutUpdate,
    ReunionUpdate,
)

from app.services.notification_service import (
    creer_notification,
)


router = APIRouter(
    prefix="/reunions",
    tags=["Réunions"],
)


# ============================================================
# CONSTANTES
# ============================================================

TYPES_REUNION_AUTORISES = {
    "MENSUELLE",
    "EXTRAORDINAIRE",
    "BUREAU",
    "KOUREL",
    "AUTRE",
}

STATUTS_REUNION_AUTORISES = {
    "PROGRAMMEE",
    "EN_COURS",
    "TERMINEE",
    "ANNULEE",
}

DOMAINES_GOOGLE_MAPS_AUTORISES = {
    "google.com",
    "www.google.com",
    "maps.google.com",
    "maps.app.goo.gl",
    "goo.gl",
}

DOMAINES_GOOGLE_MAPS_COURTS = {
    "maps.app.goo.gl",
    "goo.gl",
}


# ============================================================
# OUTIL : RECUPERER LES UTILISATEURS A NOTIFIER
# ============================================================

def recuperer_utilisateurs_a_notifier(
    db: Session,
):
    """
    Récupère les utilisateurs actifs rattachés à un membre actif.

    Une réunion générale concerne par défaut tous les membres
    actifs disposant d'un compte utilisateur actif.
    """

    return (
        db.query(Utilisateur)
        .join(
            Membre,
            Membre.id == Utilisateur.membre_id,
        )
        .filter(
            Utilisateur.actif.is_(True),
            Membre.actif.is_(True),
        )
        .all()
    )


# ============================================================
# OUTIL : NOTIFIER LES MEMBRES
# ============================================================

def notifier_membres_reunion(
    db: Session,
    titre: str,
    message: str,
    route: str = "/reunions",
    utilisateur_exclu_id: Optional[int] = None,
):
    """
    Crée une notification pour les membres actifs disposant
    d'un compte utilisateur actif.

    L'utilisateur ayant effectué l'action peut éventuellement
    être exclu pour éviter une notification inutile.
    """

    utilisateurs = recuperer_utilisateurs_a_notifier(db)

    for utilisateur in utilisateurs:

        if (
            utilisateur_exclu_id is not None
            and utilisateur.id == utilisateur_exclu_id
        ):
            continue

        creer_notification(
            db=db,
            utilisateur_id=utilisateur.id,
            titre=titre,
            message=message,
            type="REUNION",
            route=route,
        )


# ============================================================
# OUTILS DE VALIDATION
# ============================================================

def valider_type_reunion(
    type_reunion: str,
) -> str:
    """
    Vérifie que le type de réunion est autorisé.
    """

    valeur = (
        type_reunion or ""
    ).strip().upper()

    if valeur not in TYPES_REUNION_AUTORISES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Type de réunion invalide. "
                "Valeurs autorisées : "
                f"{', '.join(sorted(TYPES_REUNION_AUTORISES))}."
            ),
        )

    return valeur


def valider_statut_reunion(
    statut: str,
) -> str:
    """
    Vérifie que le statut de réunion est autorisé.
    """

    valeur = (
        statut or ""
    ).strip().upper()

    if valeur not in STATUTS_REUNION_AUTORISES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Statut de réunion invalide. "
                "Valeurs autorisées : "
                f"{', '.join(sorted(STATUTS_REUNION_AUTORISES))}."
            ),
        )

    return valeur


def nettoyer_texte(
    valeur: Optional[str],
) -> Optional[str]:
    """
    Nettoie une chaîne tout en conservant None.
    """

    if valeur is None:
        return None

    valeur = valeur.strip()

    return valeur if valeur else None


# ============================================================
# OUTILS GOOGLE MAPS
# ============================================================

def domaine_google_maps_autorise(
    hostname: Optional[str],
) -> bool:
    """
    Vérifie que le domaine appartient aux domaines Google Maps
    explicitement autorisés.
    """

    if not hostname:
        return False

    hostname = (
        hostname.lower()
        .strip()
        .rstrip(".")
    )

    return hostname in DOMAINES_GOOGLE_MAPS_AUTORISES


def url_google_maps_valide(
    url: str,
) -> bool:
    """
    Vérifie qu'une URL est une URL Google Maps autorisée.
    """

    try:
        parsed = urlparse(url)

        if parsed.scheme not in {
            "http",
            "https",
        }:
            return False

        return domaine_google_maps_autorise(
            parsed.hostname
        )

    except Exception:
        return False


def coordonnees_valides(
    latitude: float,
    longitude: float,
) -> bool:
    """
    Vérifie les limites géographiques.
    """

    return (
        -90 <= latitude <= 90
        and -180 <= longitude <= 180
    )


def convertir_coordonnees(
    latitude_text: str,
    longitude_text: str,
):
    """
    Convertit deux valeurs texte en coordonnées numériques.
    """

    try:
        latitude = float(
            latitude_text.strip()
        )

        longitude = float(
            longitude_text.strip()
        )

    except (
        ValueError,
        TypeError,
    ):
        return None

    if not coordonnees_valides(
        latitude,
        longitude,
    ):
        return None

    return latitude, longitude


def extraire_coordonnees_depuis_texte(
    texte: str,
):
    """
    Cherche des coordonnées GPS dans différentes formes
    couramment produites par Google Maps.

    Exemples pris en charge :

        @14.735123,-17.300456
        ?query=14.735123,-17.300456
        ?q=14.735123,-17.300456
        ?ll=14.735123,-17.300456
        ?center=14.735123,-17.300456
        ?destination=14.735123,-17.300456
        14.735123,-17.300456
    """

    if not texte:
        return None

    texte = unquote(texte)

    # --------------------------------------------------------
    # 1. Format @latitude,longitude
    # --------------------------------------------------------

    match = re.search(
        r"@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)",
        texte,
    )

    if match:

        resultat = convertir_coordonnees(
            match.group(1),
            match.group(2),
        )

        if resultat:
            return resultat

    # --------------------------------------------------------
    # 2. Paramètres Google Maps
    # --------------------------------------------------------

    try:

        parsed = urlparse(texte)

        params = parse_qs(
            parsed.query,
            keep_blank_values=True,
        )

        noms_parametres = [
            "query",
            "q",
            "ll",
            "center",
            "destination",
        ]

        for nom in noms_parametres:

            valeurs = params.get(nom)

            if not valeurs:
                continue

            for valeur in valeurs:

                valeur = unquote(valeur)

                match = re.search(
                    r"(-?\d+(?:\.\d+)?)\s*,\s*"
                    r"(-?\d+(?:\.\d+)?)",
                    valeur,
                )

                if not match:
                    continue

                resultat = convertir_coordonnees(
                    match.group(1),
                    match.group(2),
                )

                if resultat:
                    return resultat

    except Exception:
        pass

    # --------------------------------------------------------
    # 3. Recherche générique latitude,longitude
    # --------------------------------------------------------

    match = re.search(
        r"(?<!\d)"
        r"(-?\d{1,3}(?:\.\d+)?)"
        r"\s*,\s*"
        r"(-?\d{1,3}(?:\.\d+)?)"
        r"(?!\d)",
        texte,
    )

    if match:

        resultat = convertir_coordonnees(
            match.group(1),
            match.group(2),
        )

        if resultat:
            return resultat

    return None


def adresse_ip_privee_ou_locale(
    hostname: str,
) -> bool:
    """
    Empêche les redirections vers des adresses privées/locales.
    """

    try:

        infos = socket.getaddrinfo(
            hostname,
            None,
            type=socket.SOCK_STREAM,
        )

        for info in infos:

            adresse = info[4][0]

            ip = ipaddress.ip_address(
                adresse
            )

            if (
                ip.is_private
                or ip.is_loopback
                or ip.is_link_local
                or ip.is_reserved
            ):
                return True

    except Exception:
        return True

    return False


def suivre_redirection_google_maps(
    url: str,
) -> Optional[str]:
    """
    Suit une éventuelle redirection d'un lien Google Maps court.
    """

    try:

        parsed = urlparse(url)

        if not domaine_google_maps_autorise(
            parsed.hostname
        ):
            return None

        if not parsed.hostname:
            return None

        if adresse_ip_privee_ou_locale(
            parsed.hostname
        ):
            return None

        request = Request(
            url,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 "
                    "(Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 "
                    "(KHTML, like Gecko) "
                    "Chrome/120.0 Safari/537.36"
                )
            },
            method="GET",
        )

        with urlopen(
            request,
            timeout=8,
        ) as response:

            url_finale = response.geturl()

        if not url_google_maps_valide(
            url_finale
        ):
            return None

        return url_finale

    except Exception:
        return None


def extraire_coordonnees_google_maps(
    lien: str,
):
    """
    Procédure complète :

    1. analyse directe du lien ;
    2. si nécessaire, suit une redirection ;
    3. analyse l'URL finale.
    """

    # --------------------------------------------------------
    # Analyse directe
    # --------------------------------------------------------

    coordonnees = extraire_coordonnees_depuis_texte(
        lien
    )

    if coordonnees:
        return coordonnees

    # --------------------------------------------------------
    # Les liens courts doivent généralement être suivis.
    # --------------------------------------------------------

    try:

        parsed = urlparse(lien)

        hostname = (
            parsed.hostname or ""
        ).lower()

        if hostname not in DOMAINES_GOOGLE_MAPS_COURTS:
            return None

    except Exception:
        return None

    # --------------------------------------------------------
    # Redirection
    # --------------------------------------------------------

    url_finale = suivre_redirection_google_maps(
        lien
    )

    if not url_finale:
        return None

    # --------------------------------------------------------
    # Analyse de l'URL finale
    # --------------------------------------------------------

    return extraire_coordonnees_depuis_texte(
        url_finale
    )


# ============================================================
# 1. RÉCUPÉRER UNE LOCALISATION DEPUIS GOOGLE MAPS
# ============================================================

@router.post(
    "/localisation/google-maps",
)
def recuperer_localisation_google_maps(
    data: dict,
    current_user=Depends(
        require_permission("REUNION_CREER")
    ),
):
    """
    Récupère automatiquement la latitude et la longitude
    depuis un lien Google Maps.
    """

    lien = data.get("lien")

    if not isinstance(lien, str):

        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Le lien Google Maps est obligatoire.",
        )

    lien = lien.strip()

    if not lien:

        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Le lien Google Maps est obligatoire.",
        )

    # --------------------------------------------------------
    # Vérification URL
    # --------------------------------------------------------

    if not url_google_maps_valide(lien):

        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Le lien fourni n'est pas un lien Google Maps "
                "valide. Veuillez coller un lien Google Maps "
                "reçu ou copié depuis Google Maps."
            ),
        )

    # --------------------------------------------------------
    # Extraction des coordonnées
    # --------------------------------------------------------

    coordonnees = extraire_coordonnees_google_maps(
        lien
    )

    if not coordonnees:

        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Impossible de récupérer automatiquement "
                "les coordonnées GPS depuis ce lien Google Maps. "
                "Vous pouvez essayer de recopier le lien directement "
                "depuis Google Maps."
            ),
        )

    latitude, longitude = coordonnees

    return {
        "latitude": latitude,
        "longitude": longitude,
        "lien": lien,
        "source": "google_maps",
    }


# ============================================================
# 2. LISTER LES RÉUNIONS
# ============================================================

@router.get(
    "",
    response_model=list[ReunionResponse],
)
def lister_reunions(
    recherche: Optional[str] = Query(
        default=None,
    ),
    statut: Optional[str] = Query(
        default=None,
    ),
    type_reunion: Optional[str] = Query(
        default=None,
    ),
    inclure_inactives: bool = Query(
        default=False,
    ),
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("REUNION_CONSULTER")
    ),
):
    """
    Liste les réunions.
    """

    query = db.query(Reunion)

    if not inclure_inactives:

        query = query.filter(
            Reunion.actif.is_(True)
        )

    if recherche:

        recherche = recherche.strip()

        if recherche:

            terme = f"%{recherche}%"

            query = query.filter(
                or_(
                    Reunion.titre.ilike(terme),
                    Reunion.description.ilike(terme),
                    Reunion.lieu.ilike(terme),
                    Reunion.adresse.ilike(terme),
                    Reunion.ordre_du_jour.ilike(terme),
                )
            )

    if statut:

        statut_valide = valider_statut_reunion(
            statut
        )

        query = query.filter(
            Reunion.statut == statut_valide
        )

    if type_reunion:

        type_valide = valider_type_reunion(
            type_reunion
        )

        query = query.filter(
            Reunion.type_reunion == type_valide
        )

    return (
        query
        .order_by(
            Reunion.date_reunion.asc()
        )
        .all()
    )


# ============================================================
# 3. RÉUNIONS À VENIR
# ============================================================

@router.get(
    "/a-venir",
    response_model=list[ReunionResponse],
)
def lister_reunions_a_venir(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("REUNION_CONSULTER")
    ),
):
    """
    Retourne les réunions programmées/en cours
    dont la date est à venir.
    """

    maintenant = datetime.now()

    return (
        db.query(Reunion)
        .filter(
            Reunion.actif.is_(True),
            Reunion.date_reunion >= maintenant,
            Reunion.statut != "ANNULEE",
        )
        .order_by(
            Reunion.date_reunion.asc()
        )
        .all()
    )


# ============================================================
# 4. RÉUNIONS PASSÉES
# ============================================================

@router.get(
    "/passees",
    response_model=list[ReunionResponse],
)
def lister_reunions_passees(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("REUNION_CONSULTER")
    ),
):
    """
    Retourne les réunions passées.
    """

    maintenant = datetime.now()

    return (
        db.query(Reunion)
        .filter(
            Reunion.actif.is_(True),
            Reunion.date_reunion < maintenant,
        )
        .order_by(
            Reunion.date_reunion.desc()
        )
        .all()
    )


# ============================================================
# 5. CONSULTER UNE RÉUNION
# ============================================================

@router.get(
    "/{reunion_id}",
    response_model=ReunionResponse,
)
def consulter_reunion(
    reunion_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("REUNION_CONSULTER")
    ),
):
    """
    Consulte une réunion.
    """

    reunion = (
        db.query(Reunion)
        .filter(
            Reunion.id == reunion_id
        )
        .first()
    )

    if not reunion:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Réunion introuvable.",
        )

    return reunion


# ============================================================
# 6. CRÉER UNE RÉUNION
# + NOTIFICATION
# ============================================================

@router.post(
    "",
    response_model=ReunionResponse,
    status_code=status.HTTP_201_CREATED,
)
def creer_reunion(
    data: ReunionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("REUNION_CREER")
    ),
):
    """
    Crée une réunion et informe les membres actifs.
    """

    titre = data.titre.strip()
    lieu = data.lieu.strip()

    if not titre:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le titre de la réunion est obligatoire.",
        )

    if not lieu:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le lieu de la réunion est obligatoire.",
        )

    type_reunion = valider_type_reunion(
        data.type_reunion
    )

    statut = valider_statut_reunion(
        data.statut
    )

    reunion = Reunion(
        titre=titre,
        type_reunion=type_reunion,
        description=nettoyer_texte(
            data.description
        ),
        ordre_du_jour=nettoyer_texte(
            data.ordre_du_jour
        ),
        date_reunion=data.date_reunion,
        lieu=lieu,
        adresse=nettoyer_texte(
            data.adresse
        ),
        latitude=data.latitude,
        longitude=data.longitude,
        statut=statut,
        compte_rendu=nettoyer_texte(
            data.compte_rendu
        ),
        actif=True,
    )

    db.add(reunion)
    db.flush()

    # --------------------------------------------------------
    # Notification
    # --------------------------------------------------------

    date_formatee = reunion.date_reunion.strftime(
        "%d/%m/%Y à %H:%M"
    )

    notifier_membres_reunion(
        db=db,
        titre="Nouvelle réunion",
        message=(
            f"Une nouvelle réunion « {reunion.titre} » "
            f"est programmée le {date_formatee} "
            f"à {reunion.lieu}."
        ),
        route="/reunions",
        utilisateur_exclu_id=getattr(
            current_user,
            "id",
            None,
        ),
    )

    db.commit()
    db.refresh(reunion)

    return reunion


# ============================================================
# 7. MODIFIER UNE RÉUNION
# + NOTIFICATION
# ============================================================

@router.put(
    "/{reunion_id}",
    response_model=ReunionResponse,
)
def modifier_reunion(
    reunion_id: int,
    data: ReunionUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("REUNION_MODIFIER")
    ),
):
    """
    Modifie une réunion et informe les membres actifs.
    """

    reunion = (
        db.query(Reunion)
        .filter(
            Reunion.id == reunion_id
        )
        .first()
    )

    if not reunion:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Réunion introuvable.",
        )

    titre = data.titre.strip()
    lieu = data.lieu.strip()

    if not titre:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le titre de la réunion est obligatoire.",
        )

    if not lieu:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le lieu de la réunion est obligatoire.",
        )

    type_reunion = valider_type_reunion(
        data.type_reunion
    )

    statut = valider_statut_reunion(
        data.statut
    )

    reunion.titre = titre
    reunion.type_reunion = type_reunion
    reunion.description = nettoyer_texte(
        data.description
    )
    reunion.ordre_du_jour = nettoyer_texte(
        data.ordre_du_jour
    )
    reunion.date_reunion = data.date_reunion
    reunion.lieu = lieu
    reunion.adresse = nettoyer_texte(
        data.adresse
    )
    reunion.latitude = data.latitude
    reunion.longitude = data.longitude
    reunion.statut = statut
    reunion.compte_rendu = nettoyer_texte(
        data.compte_rendu
    )

    # --------------------------------------------------------
    # Notification
    # --------------------------------------------------------

    date_formatee = reunion.date_reunion.strftime(
        "%d/%m/%Y à %H:%M"
    )

    notifier_membres_reunion(
        db=db,
        titre="Réunion mise à jour",
        message=(
            f"La réunion « {reunion.titre} » a été modifiée. "
            f"Elle est prévue le {date_formatee} "
            f"à {reunion.lieu}."
        ),
        route="/reunions",
        utilisateur_exclu_id=getattr(
            current_user,
            "id",
            None,
        ),
    )

    db.commit()
    db.refresh(reunion)

    return reunion


# ============================================================
# 8. MODIFIER LE STATUT
# + NOTIFICATION
# ============================================================

@router.patch(
    "/{reunion_id}/statut",
    response_model=ReunionResponse,
)
def modifier_statut_reunion(
    reunion_id: int,
    data: ReunionStatutUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("REUNION_MODIFIER")
    ),
):
    """
    Modifie le statut d'une réunion.
    """

    reunion = (
        db.query(Reunion)
        .filter(
            Reunion.id == reunion_id
        )
        .first()
    )

    if not reunion:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Réunion introuvable.",
        )

    ancien_statut = reunion.statut

    nouveau_statut = valider_statut_reunion(
        data.statut
    )

    reunion.statut = nouveau_statut

    # --------------------------------------------------------
    # Notification
    # --------------------------------------------------------

    if ancien_statut != nouveau_statut:

        notifier_membres_reunion(
            db=db,
            titre="Statut d'une réunion modifié",
            message=(
                f"Le statut de la réunion « {reunion.titre} » "
                f"est maintenant « {nouveau_statut} »."
            ),
            route="/reunions",
            utilisateur_exclu_id=getattr(
                current_user,
                "id",
                None,
            ),
        )

    db.commit()
    db.refresh(reunion)

    return reunion


# ============================================================
# 9. MODIFIER LE COMPTE RENDU
# + NOTIFICATION
# ============================================================

@router.patch(
    "/{reunion_id}/compte-rendu",
    response_model=ReunionResponse,
)
def modifier_compte_rendu(
    reunion_id: int,
    data: ReunionCompteRenduUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("REUNION_MODIFIER")
    ),
):
    """
    Ajoute ou modifie le compte rendu.
    """

    reunion = (
        db.query(Reunion)
        .filter(
            Reunion.id == reunion_id
        )
        .first()
    )

    if not reunion:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Réunion introuvable.",
        )

    reunion.compte_rendu = nettoyer_texte(
        data.compte_rendu
    )

    # --------------------------------------------------------
    # Notification
    # --------------------------------------------------------

    notifier_membres_reunion(
        db=db,
        titre="Compte rendu disponible",
        message=(
            f"Le compte rendu de la réunion "
            f"« {reunion.titre} » a été ajouté ou mis à jour."
        ),
        route="/reunions",
        utilisateur_exclu_id=getattr(
            current_user,
            "id",
            None,
        ),
    )

    db.commit()
    db.refresh(reunion)

    return reunion


# ============================================================
# 10. ANNULER UNE RÉUNION
# + NOTIFICATION
# ============================================================

@router.patch(
    "/{reunion_id}/annuler",
    response_model=ReunionResponse,
)
def annuler_reunion(
    reunion_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("REUNION_MODIFIER")
    ),
):
    """
    Annule une réunion.
    """

    reunion = (
        db.query(Reunion)
        .filter(
            Reunion.id == reunion_id
        )
        .first()
    )

    if not reunion:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Réunion introuvable.",
        )

    if reunion.statut == "ANNULEE":

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cette réunion est déjà annulée.",
        )

    reunion.statut = "ANNULEE"

    # --------------------------------------------------------
    # Notification
    # --------------------------------------------------------

    notifier_membres_reunion(
        db=db,
        titre="Réunion annulée",
        message=(
            f"La réunion « {reunion.titre} » "
            "a été annulée."
        ),
        route="/reunions",
        utilisateur_exclu_id=getattr(
            current_user,
            "id",
            None,
        ),
    )

    db.commit()
    db.refresh(reunion)

    return reunion


# ============================================================
# 11. DÉSACTIVER UNE RÉUNION
# + NOTIFICATION
# ============================================================

@router.patch(
    "/{reunion_id}/desactiver",
    response_model=ReunionResponse,
)
def desactiver_reunion(
    reunion_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("REUNION_SUPPRIMER")
    ),
):
    """
    Désactive une réunion sans la supprimer
    physiquement de la base.
    """

    reunion = (
        db.query(Reunion)
        .filter(
            Reunion.id == reunion_id
        )
        .first()
    )

    if not reunion:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Réunion introuvable.",
        )

    if not reunion.actif:

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cette réunion est déjà désactivée.",
        )

    reunion.actif = False

    # --------------------------------------------------------
    # Notification
    # --------------------------------------------------------

    notifier_membres_reunion(
        db=db,
        titre="Réunion supprimée",
        message=(
            f"La réunion « {reunion.titre} » "
            "a été retirée du programme."
        ),
        route="/reunions",
        utilisateur_exclu_id=getattr(
            current_user,
            "id",
            None,
        ),
    )

    db.commit()
    db.refresh(reunion)

    return reunion


# ============================================================
# 12. RÉACTIVER UNE RÉUNION
# + NOTIFICATION
# ============================================================

@router.patch(
    "/{reunion_id}/activer",
    response_model=ReunionResponse,
)
def activer_reunion(
    reunion_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("REUNION_MODIFIER")
    ),
):
    """
    Réactive une réunion.
    """

    reunion = (
        db.query(Reunion)
        .filter(
            Reunion.id == reunion_id
        )
        .first()
    )

    if not reunion:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Réunion introuvable.",
        )

    if reunion.actif:

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cette réunion est déjà active.",
        )

    reunion.actif = True

    # Une réunion réactivée ne doit pas rester
    # dans un statut incohérent.

    if reunion.statut == "ANNULEE":
        reunion.statut = "PROGRAMMEE"

    # --------------------------------------------------------
    # Notification
    # --------------------------------------------------------

    date_formatee = reunion.date_reunion.strftime(
        "%d/%m/%Y à %H:%M"
    )

    notifier_membres_reunion(
        db=db,
        titre="Réunion réactivée",
        message=(
            f"La réunion « {reunion.titre} » "
            f"a été réactivée. "
            f"Elle est prévue le {date_formatee} "
            f"à {reunion.lieu}."
        ),
        route="/reunions",
        utilisateur_exclu_id=getattr(
            current_user,
            "id",
            None,
        ),
    )

    db.commit()
    db.refresh(reunion)

    return reunion