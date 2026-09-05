from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.ton import Ton


TONS = [
    "WKSM - 71",
    "WKSM - 78",
    "Sokhna Fatou Dia",
    "Baye Ablaye Niang",
    "Baye Saliou Thiam",
    "S Mayib Gueye",
    "Baye Moustapha Diop",
    "Baye Alioune Fall",
    "S Abdou Khadr Gassama",
    "Nawaytou",
    "S Mbacké Fall",
    "S Cissé"
    "Autre",
]


def seed_tons(db: Session) -> None:
    for nom in TONS:
        ton_existant = (
            db.query(Ton)
            .filter(Ton.nom == nom)
            .first()
        )

        if ton_existant:
            print(f"Déjà présent : {nom}")
            continue

        ton = Ton(
            nom=nom,
            actif=True,
        )

        db.add(ton)
        print(f"Ajouté : {nom}")

    db.commit()


def main() -> None:
    db = SessionLocal()

    try:
        seed_tons(db)
        print("\nLes tons ont été enregistrés avec succès.")

    except Exception as e:
        db.rollback()
        print(f"\nErreur lors de l'enregistrement des tons : {e}")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()