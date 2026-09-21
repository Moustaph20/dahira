import { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  TrendingDown,
  HandCoins,
  Receipt,
  Plus,
  RefreshCw,
  X,
  CalendarDays,
  FileText,
  Building2,
  AlertCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  UserRound,
  Paperclip,
} from "lucide-react";

import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Finances() {
  const { aPermission } = useAuth();

  const peutConsulterDepenses = aPermission("DEPENSE_CONSULTER");
  const peutCreerDepense = aPermission("DEPENSE_CREER");

  const peutConsulterAides = aPermission("AIDE_EXTERIEURE_CONSULTER");
  const peutCreerAide = aPermission("AIDE_EXTERIEURE_CREER");

  const peutConsulterCotisations = aPermission("COTISATION_CONSULTER");

  const peutCreerPaiement =
    aPermission("PAIEMENT_CREER") ||
    aPermission("PAIEMENT_ENREGISTRER") ||
    aPermission("COTISATION_CREER");

  const [depenses, setDepenses] = useState([]);
  const [aides, setAides] = useState([]);
  const [cotisations, setCotisations] = useState([]);

  // Tous les membres actifs.
  // Ils servent notamment au calcul des cotisations prévues.
  const [membresActifs, setMembresActifs] = useState([]);

  // Membres actifs dont la cotisation mensuelle fixe est de 0.
  // Ils peuvent quand même effectuer des versements volontaires.
  const [membresNonCotisants, setMembresNonCotisants] = useState([]);

  const [chargement, setChargement] = useState(true);
  const [chargementMembres, setChargementMembres] = useState(false);

  const [erreur, setErreur] = useState("");
  const [modal, setModal] = useState(null);

  const [enregistrement, setEnregistrement] = useState(false);
  const [messageSucces, setMessageSucces] = useState("");
  const [erreurFormulaire, setErreurFormulaire] = useState("");

  const aujourdHui = new Date().toISOString().slice(0, 10);

  const [formDepense, setFormDepense] = useState({
    motif: "",
    type_sortie: "",
    remis_a: "",
    piece_jointe: null,
    montant: "",
    date_depense: aujourdHui,
    description: "",
  });

  const [formAide, setFormAide] = useState({
    membre_id: "",
    source: "",
    montant: "",
    description: "",
    date_aide: aujourdHui,
  });

  const extraireListe = (data, cle) => {
    if (Array.isArray(data)) {
      return data;
    }

    return Array.isArray(data?.[cle]) ? data[cle] : [];
  };

  const chargerDonnees = async () => {
    setChargement(true);
    setErreur("");

    try {
      const requetes = [];

      if (peutConsulterDepenses) {
        requetes.push(
          api.get("/depenses").catch(() => ({ data: [] }))
        );
      } else {
        requetes.push({ data: [] });
      }

      if (peutConsulterAides) {
        requetes.push(
          api.get("/aides-exterieures").catch(() => ({ data: [] }))
        );
      } else {
        requetes.push({ data: [] });
      }

      if (peutConsulterCotisations) {
        requetes.push(
          api.get("/cotisations").catch(() => ({ data: [] }))
        );
      } else {
        requetes.push({ data: [] });
      }

      /*
       * On charge également TOUS les membres actifs.
       *
       * Cette liste sert au calcul :
       *
       * Cotisations prévues =
       * somme des montant_cotisation de TOUS les membres actifs
       *
       * Un membre à 0 FCFA est donc bien pris en compte,
       * mais contribue naturellement à hauteur de 0 FCFA.
       */
      if (peutConsulterCotisations || peutCreerPaiement) {
        requetes.push(
          api
            .get("/cotisations/membres-actifs")
            .catch(() => ({ data: { membres: [] } }))
        );
      } else {
        requetes.push({ data: { membres: [] } });
      }

      const [
        responseDepenses,
        responseAides,
        responseCotisations,
        responseMembres,
      ] = await Promise.all(requetes);

      const listeDepenses = extraireListe(
        responseDepenses.data,
        "depenses"
      );

      const listeAides = extraireListe(
        responseAides.data,
        "aides"
      );

      const listeCotisations = extraireListe(
        responseCotisations.data,
        "cotisations"
      );

      /*
       * L'API /cotisations/membres-actifs renvoie :
       *
       * {
       *   membres: [...]
       * }
       *
       * et non directement [...]
       */
      const listeMembres = extraireListe(
        responseMembres.data,
        "membres"
      ).filter((membre) => membre?.actif === true);

      setDepenses(listeDepenses);
      setAides(listeAides);
      setCotisations(listeCotisations);

      setMembresActifs(listeMembres);

      setMembresNonCotisants(
        listeMembres.filter(
          (membre) =>
            Number(membre?.montant_cotisation ?? 0) === 0
        )
      );
    } catch (error) {
      console.error("Erreur chargement finances :", error);

      setErreur(
        error?.response?.data?.detail ||
          "Impossible de charger les données financières."
      );
    } finally {
      setChargement(false);
    }
  };

  const chargerMembresNonCotisants = async () => {
    if (!peutCreerPaiement) {
      setMembresNonCotisants([]);
      return;
    }

    setChargementMembres(true);

    try {
      const response = await api.get(
        "/cotisations/membres-actifs"
      );

      const membres = extraireListe(
        response.data,
        "membres"
      ).filter((membre) => membre?.actif === true);

      setMembresActifs(membres);

      setMembresNonCotisants(
        membres.filter(
          (membre) =>
            Number(membre?.montant_cotisation ?? 0) === 0
        )
      );
    } catch (error) {
      console.error(
        "Erreur chargement membres non cotisants :",
        error
      );

      setMembresNonCotisants([]);
    } finally {
      setChargementMembres(false);
    }
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  useEffect(() => {
    if (modal === "aide") {
      chargerMembresNonCotisants();
    }
  }, [modal]);

  const totalDepenses = useMemo(
    () =>
      depenses.reduce(
        (total, depense) =>
          total + Number(depense?.montant || 0),
        0
      ),
    [depenses]
  );

  const totalAides = useMemo(
    () =>
      aides.reduce(
        (total, aide) =>
          total + Number(aide?.montant || 0),
        0
      ),
    [aides]
  );

  /*
   * IMPORTANT :
   *
   * Les cotisations prévues NE SONT PLUS calculées à partir
   * des lignes existantes dans la table cotisations.
   *
   * Elles sont calculées à partir de TOUS les membres actifs.
   *
   * Exemple :
   *
   * 35 membres actifs
   * - certains à 5 000
   * - certains à 7 000
   * - certains à 0
   *
   * Le total prévu correspond à la somme des montants
   * mensuels de ces 35 membres.
   */
  const totalCotisationsPrevues = useMemo(
    () =>
      membresActifs.reduce(
        (total, membre) =>
          total +
          Number(membre?.montant_cotisation || 0),
        0
      ),
    [membresActifs]
  );

  /*
   * Ici on garde uniquement l'argent réellement encaissé
   * à travers les paiements des cotisations/versements.
   */
  const totalPaiementsCotisations = useMemo(
    () =>
      cotisations.reduce(
        (total, cotisation) =>
          total +
          Number(cotisation?.montant_cotise || 0),
        0
      ),
    [cotisations]
  );

  /*
   * Les recettes réelles =
   * - paiements/versements des membres
   * - Barkelou extérieurs
   */
  const totalRecettes =
    totalPaiementsCotisations + totalAides;

  /*
   * Le reste à encaisser est basé sur les prévisions
   * de TOUS les membres actifs.
   *
   * Les Barkelou extérieurs ne diminuent pas ce reste,
   * puisqu'ils ne correspondent pas aux cotisations des membres.
   */
  const totalResteAEncaisser = Math.max(
    0,
    totalCotisationsPrevues -
      totalPaiementsCotisations
  );

  /*
   * Le solde correspond uniquement à l'argent réellement
   * encaissé moins les dépenses.
   *
   * Les cotisations prévues n'entrent donc jamais dans
   * le solde tant qu'elles ne sont pas encaissées.
   */
  const solde = totalRecettes - totalDepenses;

  const fermerModal = () => {
    if (enregistrement) return;

    setModal(null);
    setErreurFormulaire("");
    setMessageSucces("");
  };

  const ajouterDepense = async (event) => {
    event.preventDefault();

    setErreurFormulaire("");
    setMessageSucces("");

    if (!formDepense.motif.trim()) {
      setErreurFormulaire("Le motif est obligatoire.");
      return;
    }

    if (
      !formDepense.montant ||
      Number(formDepense.montant) <= 0
    ) {
      setErreurFormulaire(
        "Le montant doit être supérieur à 0."
      );
      return;
    }

    try {
      setEnregistrement(true);

      const formData = new FormData();

      formData.append(
        "motif",
        formDepense.motif.trim()
      );

      formData.append(
        "montant",
        Number(formDepense.montant)
      );

      formData.append(
        "date_depense",
        formDepense.date_depense
      );

      if (formDepense.type_sortie.trim()) {
        formData.append(
          "type_sortie",
          formDepense.type_sortie.trim()
        );
      }

      if (formDepense.remis_a.trim()) {
        formData.append(
          "remis_a",
          formDepense.remis_a.trim()
        );
      }

      if (formDepense.description.trim()) {
        formData.append(
          "description",
          formDepense.description.trim()
        );
      }

      if (formDepense.piece_jointe) {
        formData.append(
          "piece_jointe",
          formDepense.piece_jointe
        );
      }

      await api.post("/depenses", formData);

      setMessageSucces(
        "Dépense enregistrée avec succès."
      );

      setFormDepense({
        motif: "",
        type_sortie: "",
        remis_a: "",
        piece_jointe: null,
        montant: "",
        date_depense: aujourdHui,
        description: "",
      });

      await chargerDonnees();

      setTimeout(() => {
        setModal(null);
        setMessageSucces("");
      }, 1000);
    } catch (error) {
      console.error(
        "Erreur ajout dépense :",
        error
      );

      setErreurFormulaire(
        error?.response?.data?.detail ||
          "Impossible d'enregistrer la dépense."
      );
    } finally {
      setEnregistrement(false);
    }
  };

  const ajouterAide = async (event) => {
    event.preventDefault();

    setErreurFormulaire("");
    setMessageSucces("");

    if (
      !formAide.montant ||
      Number(formAide.montant) <= 0
    ) {
      setErreurFormulaire(
        "Le montant doit être supérieur à 0."
      );
      return;
    }

    try {
      setEnregistrement(true);

      /*
       * CAS 1 :
       * Barkelou provenant d'un membre non cotisant.
       *
       * On l'enregistre comme Paiement sur une cotisation
       * à 0 FCFA.
       */
      if (formAide.membre_id) {
        if (!peutCreerPaiement) {
          setErreurFormulaire(
            "Vous n'avez pas la permission d'enregistrer un versement."
          );
          return;
        }

        const membreId = Number(formAide.membre_id);

        const membre = membresNonCotisants.find(
          (item) =>
            Number(item.id) === membreId
        );

        if (!membre) {
          setErreurFormulaire(
            "Le membre sélectionné est introuvable."
          );
          return;
        }

        const maintenant = new Date();

        const moisActuel =
          maintenant.toLocaleDateString(
            "fr-FR",
            {
              month: "long",
            }
          );

        const moisNormalise = moisActuel
          .toLowerCase()
          .normalize("NFD")
          .replace(
            /[\u0300-\u036f]/g,
            ""
          );

        const anneeActuelle =
          maintenant.getFullYear();

        let cotisation =
          cotisations.find(
            (item) =>
              Number(item?.membre_id) ===
                membreId &&
              String(item?.annee) ===
                String(anneeActuelle) &&
              String(
                item?.mois_concerne || ""
              )
                .toLowerCase()
                .normalize("NFD")
                .replace(
                  /[\u0300-\u036f]/g,
                  ""
                ) === moisNormalise
          );

        /*
         * Si aucune cotisation n'existe encore
         * pour ce membre et ce mois, on crée une
         * cotisation à 0 FCFA.
         */
        if (!cotisation) {
          const responseCotisation =
            await api.post(
              "/cotisations",
              null,
              {
                params: {
                  membre_id: membreId,
                  montant: 0,
                  mois_concerne:
                    moisActuel,
                  annee:
                    anneeActuelle,
                },
              }
            );

          cotisation =
            responseCotisation.data;
        }

        /*
         * Le montant réel est enregistré
         * comme Paiement.
         */
        await api.post(
          `/cotisations/${cotisation.id}/paiements`,
          null,
          {
            params: {
              montant: Number(
                formAide.montant
              ),
              mode_paiement:
                "espèce",
              date_paiement:
                formAide.date_aide ||
                aujourdHui,
              reference: null,
            },
          }
        );

        setMessageSucces(
          `Versement de ${Number(
            formAide.montant
          ).toLocaleString(
            "fr-FR"
          )} FCFA enregistré pour ${membre.prenom} ${membre.nom}.`
        );

        setFormAide({
          membre_id: "",
          source: "",
          montant: "",
          description: "",
          date_aide: aujourdHui,
        });

        await chargerDonnees();

        setTimeout(() => {
          setModal(null);
          setMessageSucces("");
        }, 1200);

        return;
      }

      /*
       * CAS 2 :
       * Barkelou provenant d'une source extérieure.
       */
      if (!formAide.source.trim()) {
        setErreurFormulaire(
          "Indiquez la source du Barkelou extérieur."
        );
        return;
      }

      await api.post(
        "/aides-exterieures",
        {
          source:
            formAide.source.trim(),
          montant:
            Number(
              formAide.montant
            ),
          description:
            formAide.description.trim() ||
            null,
          date_aide:
            formAide.date_aide ||
            aujourdHui,
        }
      );

      setMessageSucces(
        "Barkelou extérieur enregistré avec succès."
      );

      setFormAide({
        membre_id: "",
        source: "",
        montant: "",
        description: "",
        date_aide: aujourdHui,
      });

      await chargerDonnees();

      setTimeout(() => {
        setModal(null);
        setMessageSucces("");
      }, 1000);
    } catch (error) {
      console.error(
        "Erreur ajout Barkelou :",
        error
      );

      const detail =
        error?.response?.data?.detail;

      setErreurFormulaire(
        typeof detail === "string"
          ? detail
          : "Impossible d'enregistrer le Barkelou."
      );
    } finally {
      setEnregistrement(false);
    }
  };

  const formatMontant = (montant) =>
    Number(montant || 0).toLocaleString(
      "fr-FR"
    );

  const formatDate = (date) => {
    if (!date) return "—";

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
      return date;
    }

    return d.toLocaleDateString(
      "fr-FR"
    );
  };

  const nomMembre = (membre) =>
    `${membre?.prenom || ""} ${
      membre?.nom || ""
    }`.trim();

  const dernieresDepenses =
    [...depenses]
      .sort(
        (a, b) =>
          new Date(
            b?.date_depense || 0
          ) -
          new Date(
            a?.date_depense || 0
          )
      )
      .slice(0, 5);

  const derniersAides =
    [...aides]
      .sort(
        (a, b) =>
          new Date(
            b?.date_aide || 0
          ) -
          new Date(
            a?.date_aide || 0
          )
      )
      .slice(0, 5);

  if (chargement) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Chargement des finances...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Situation financière
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Suivi des recettes, versements, Barkelou et dépenses.
          </p>
        </div>

        <button
          type="button"
          onClick={chargerDonnees}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      {erreur && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{erreur}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Recettes encaissées
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatMontant(
                  totalRecettes
                )}{" "}
                FCFA
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <ArrowUpCircle className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Sorties d'argent
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatMontant(
                  totalDepenses
                )}{" "}
                FCFA
              </p>
            </div>

            <div className="rounded-xl bg-red-50 p-3 text-red-600">
              <ArrowDownCircle className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Barkelou extérieur
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatMontant(
                  totalAides
                )}{" "}
                FCFA
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <HandCoins className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Solde disponible
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatMontant(
                  solde
                )}{" "}
                FCFA
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <Wallet className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {peutConsulterCotisations && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Cotisations et versements des membres
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Les montants encaissés correspondent uniquement à
                l'argent réellement reçu.
              </p>
            </div>

            <Receipt className="h-6 w-6 text-slate-400" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Cotisations prévues
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {formatMontant(
                  totalCotisationsPrevues
                )}{" "}
                FCFA
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-sm text-emerald-700">
                Cotisations et versements encaissés
              </p>

              <p className="mt-1 text-xl font-bold text-emerald-800">
                {formatMontant(
                  totalPaiementsCotisations
                )}{" "}
                FCFA
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 p-4">
              <p className="text-sm text-amber-700">
                Reste à encaisser
              </p>

              <p className="mt-1 text-xl font-bold text-amber-800">
                {formatMontant(
                  totalResteAEncaisser
                )}{" "}
                FCFA
              </p>
            </div>
          </div>
        </div>
      )}

      {(peutCreerDepense ||
        peutCreerAide) && (
        <div className="flex flex-wrap gap-3">
          {peutCreerDepense && (
            <button
              type="button"
              onClick={() => {
                setErreurFormulaire("");
                setMessageSucces("");
                setModal("depense");
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Ajouter une dépense
            </button>
          )}

          {peutCreerAide && (
            <button
              type="button"
              onClick={() => {
                setErreurFormulaire("");
                setMessageSucces("");
                setModal("aide");
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <HandCoins className="h-4 w-4" />
              Ajouter un Barkelou
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {peutConsulterDepenses && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="font-bold text-slate-900">
                  Dernières dépenses
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Les dernières sorties d'argent enregistrées.
                </p>
              </div>

              <TrendingDown className="h-5 w-5 text-red-500" />
            </div>

            <div className="divide-y divide-slate-100">
              {dernieresDepenses.length ===
              0 ? (
                <div className="p-6 text-center text-sm text-slate-500">
                  Aucune dépense enregistrée.
                </div>
              ) : (
                dernieresDepenses.map(
                  (depense) => (
                    <div
                      key={depense.id}
                      className="flex items-center justify-between gap-4 p-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {depense.motif ||
                            "Dépense"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(
                            depense.date_depense
                          )}

                          {depense.remis_a
                            ? ` • ${depense.remis_a}`
                            : ""}
                        </p>
                      </div>

                      <p className="shrink-0 font-bold text-red-600">
                        -{" "}
                        {formatMontant(
                          depense.montant
                        )}{" "}
                        FCFA
                      </p>
                    </div>
                  )
                )
              )}
            </div>
          </div>
        )}

        {peutConsulterAides && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="font-bold text-slate-900">
                  Derniers Barkelou extérieurs
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Les aides reçues de sources extérieures.
                </p>
              </div>

              <HandCoins className="h-5 w-5 text-emerald-500" />
            </div>

            <div className="divide-y divide-slate-100">
              {derniersAides.length ===
              0 ? (
                <div className="p-6 text-center text-sm text-slate-500">
                  Aucun Barkelou extérieur enregistré.
                </div>
              ) : (
                derniersAides.map(
                  (aide) => (
                    <div
                      key={aide.id}
                      className="flex items-center justify-between gap-4 p-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {aide.source ||
                            "Source extérieure"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(
                            aide.date_aide
                          )}

                          {aide.description
                            ? ` • ${aide.description}`
                            : ""}
                        </p>
                      </div>

                      <p className="shrink-0 font-bold text-emerald-600">
                        +{" "}
                        {formatMontant(
                          aide.montant
                        )}{" "}
                        FCFA
                      </p>
                    </div>
                  )
                )
              )}
            </div>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {modal === "depense"
                    ? "Ajouter une dépense"
                    : "Ajouter un Barkelou"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {modal === "depense"
                    ? "Enregistrer une sortie d'argent."
                    : "Enregistrer un versement d'un membre ou un Barkelou extérieur."}
                </p>
              </div>

              <button
                type="button"
                onClick={fermerModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modal === "depense" ? (
              <form
                onSubmit={ajouterDepense}
                className="space-y-5 p-5"
              >
                {erreurFormulaire && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {erreurFormulaire}
                  </div>
                )}

                {messageSucces && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                    {messageSucces}
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Motif *
                  </label>

                  <input
                    type="text"
                    value={
                      formDepense.motif
                    }
                    onChange={(e) =>
                      setFormDepense(
                        (prev) => ({
                          ...prev,
                          motif:
                            e.target
                              .value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                    placeholder="Ex. Achat de matériel"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Montant *
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={
                        formDepense.montant
                      }
                      onChange={(e) =>
                        setFormDepense(
                          (prev) => ({
                            ...prev,
                            montant:
                              e.target
                                .value,
                          })
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Date *
                    </label>

                    <input
                      type="date"
                      value={
                        formDepense.date_depense
                      }
                      onChange={(e) =>
                        setFormDepense(
                          (prev) => ({
                            ...prev,
                            date_depense:
                              e.target
                                .value,
                          })
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Type de sortie
                  </label>

                  <input
                    type="text"
                    value={
                      formDepense.type_sortie
                    }
                    onChange={(e) =>
                      setFormDepense(
                        (prev) => ({
                          ...prev,
                          type_sortie:
                            e.target
                              .value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                    placeholder="Ex. Achat, transport..."
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Remis à
                  </label>

                  <input
                    type="text"
                    value={
                      formDepense.remis_a
                    }
                    onChange={(e) =>
                      setFormDepense(
                        (prev) => ({
                          ...prev,
                          remis_a:
                            e.target
                              .value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                    placeholder="Nom du bénéficiaire"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Description
                  </label>

                  <textarea
                    rows={3}
                    value={
                      formDepense.description
                    }
                    onChange={(e) =>
                      setFormDepense(
                        (prev) => ({
                          ...prev,
                          description:
                            e.target
                              .value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                    placeholder="Informations complémentaires..."
                  />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Paperclip className="h-4 w-4" />
                    Pièce jointe
                  </label>

                  <input
                    type="file"
                    onChange={(e) =>
                      setFormDepense(
                        (prev) => ({
                          ...prev,
                          piece_jointe:
                            e.target
                              .files?.[0] ||
                            null,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={
                    enregistrement
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {enregistrement && (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  )}

                  Enregistrer la dépense
                </button>
              </form>
            ) : (
              <form
                onSubmit={ajouterAide}
                className="space-y-5 p-5"
              >
                {erreurFormulaire && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {erreurFormulaire}
                  </div>
                )}

                {messageSucces && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                    {messageSucces}
                  </div>
                )}

                {peutCreerPaiement && (
                  <div>
                    <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <UserRound className="h-4 w-4" />
                      Membre non cotisant
                    </label>

                    <select
                      value={
                        formAide.membre_id
                      }
                      onChange={(e) =>
                        setFormAide(
                          (prev) => ({
                            ...prev,
                            membre_id:
                              e.target
                                .value,
                            source: "",
                          })
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
                    >
                      <option value="">
                        — Barkelou extérieur —
                      </option>

                      {membresNonCotisants.map(
                        (membre) => (
                          <option
                            key={
                              membre.id
                            }
                            value={
                              membre.id
                            }
                          >
                            {nomMembre(
                              membre
                            )}{" "}
                            — 0 FCFA
                          </option>
                        )
                      )}
                    </select>

                    {chargementMembres && (
                      <p className="mt-2 text-xs text-slate-500">
                        Chargement des membres...
                      </p>
                    )}

                    {!chargementMembres &&
                      membresNonCotisants.length ===
                        0 && (
                        <p className="mt-2 text-xs text-slate-500">
                          Aucun membre non cotisant disponible.
                        </p>
                      )}

                    {formAide.membre_id && (
                      <div className="mt-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
                        Ce montant sera enregistré
                        comme{" "}
                        <strong>
                          versement du membre
                        </strong>{" "}
                        et apparaîtra dans ses
                        versements. Il ne sera pas
                        enregistré comme Barkelou
                        extérieur.
                      </div>
                    )}
                  </div>
                )}

                {!formAide.membre_id && (
                  <div>
                    <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Building2 className="h-4 w-4" />
                      Source extérieure *
                    </label>

                    <input
                      type="text"
                      value={
                        formAide.source
                      }
                      onChange={(e) =>
                        setFormAide(
                          (prev) => ({
                            ...prev,
                            source:
                              e.target
                                .value,
                          })
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                      placeholder="Ex. Donateur, partenaire..."
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Montant *
                    </label>

                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={
                        formAide.montant
                      }
                      onChange={(e) =>
                        setFormAide(
                          (prev) => ({
                            ...prev,
                            montant:
                              e.target
                                .value,
                          })
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <CalendarDays className="h-4 w-4" />
                      Date *
                    </label>

                    <input
                      type="date"
                      value={
                        formAide.date_aide
                      }
                      onChange={(e) =>
                        setFormAide(
                          (prev) => ({
                            ...prev,
                            date_aide:
                              e.target
                                .value,
                          })
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <FileText className="h-4 w-4" />
                    Description
                  </label>

                  <textarea
                    rows={3}
                    value={
                      formAide.description
                    }
                    onChange={(e) =>
                      setFormAide(
                        (prev) => ({
                          ...prev,
                          description:
                            e.target
                              .value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                    placeholder="Informations complémentaires..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={
                    enregistrement
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {enregistrement && (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  )}

                  Enregistrer
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}