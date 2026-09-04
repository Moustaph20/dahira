import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Pencil,
  KeyRound,
  UserCheck,
  UserX,
  X,
  ShieldCheck,
} from "lucide-react";

import {
  getUtilisateurs,
  creerUtilisateur,
  modifierUtilisateur,
  modifierMotDePasse,
  desactiverUtilisateur,
  activerUtilisateur,
} from "../api/utilisateurs";

import { getMembres } from "../api/membres";
import { getFonctions } from "../api/fonctions";

function Utilisateurs() {
  // ============================================================
  // DONNÉES
  // ============================================================

  const [utilisateurs, setUtilisateurs] = useState([]);
  const [membres, setMembres] = useState([]);
  const [fonctions, setFonctions] = useState([]);

  // ============================================================
  // ÉTATS
  // ============================================================

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [recherche, setRecherche] = useState("");

  const [inclureInactifs, setInclureInactifs] =
    useState(false);

  const [modalOuverte, setModalOuverte] =
    useState(false);

  const [modeEdition, setModeEdition] =
    useState(false);

  const [utilisateurSelectionne, setUtilisateurSelectionne] =
    useState(null);

  const [modalMotDePasse, setModalMotDePasse] =
    useState(false);

  const [motDePasse, setMotDePasse] =
    useState("");

  const [enregistrement, setEnregistrement] =
    useState(false);

  // ============================================================
  // FORMULAIRE
  // ============================================================

  const [formulaire, setFormulaire] = useState({
    membre_id: "",
    identifiant: "",
    mot_de_passe: "",
    fonction_ids: [],
  });

  // ============================================================
  // CHARGER LES UTILISATEURS
  // ============================================================

  async function chargerUtilisateurs() {
    try {
      setChargement(true);
      setErreur("");

      const data = await getUtilisateurs(
        recherche,
        inclureInactifs
      );

      setUtilisateurs(data);
    } catch (error) {
      console.error(error);

      setErreur(
        error.response?.data?.detail ||
          "Impossible de charger les utilisateurs."
      );
    } finally {
      setChargement(false);
    }
  }

  // ============================================================
  // CHARGER MEMBRES + FONCTIONS
  // ============================================================

  async function chargerDonneesFormulaire() {
    try {
      const [membresData, fonctionsData] =
        await Promise.all([
          getMembres("", false),
          getFonctions(false),
        ]);

      setMembres(membresData);
      setFonctions(fonctionsData);
    } catch (error) {
      console.error(error);

      setErreur(
        error.response?.data?.detail ||
          "Impossible de charger les données du formulaire."
      );
    }
  }

  // ============================================================
  // INITIALISATION
  // ============================================================

  useEffect(() => {
    chargerUtilisateurs();
  }, [inclureInactifs]);

  // ============================================================
  // FORMULAIRE
  // ============================================================

  function modifierChamp(e) {
    const { name, value } = e.target;

    setFormulaire((ancien) => ({
      ...ancien,
      [name]: value,
    }));
  }

  function toggleFonction(id) {
    setFormulaire((ancien) => {
      const existe = ancien.fonction_ids.includes(id);

      return {
        ...ancien,
        fonction_ids: existe
          ? ancien.fonction_ids.filter(
              (fonctionId) => fonctionId !== id
            )
          : [...ancien.fonction_ids, id],
      };
    });
  }

  // ============================================================
  // OUVRIR CRÉATION
  // ============================================================

  async function ouvrirCreation() {
    await chargerDonneesFormulaire();

    setModeEdition(false);
    setUtilisateurSelectionne(null);

    setFormulaire({
      membre_id: "",
      identifiant: "",
      mot_de_passe: "",
      fonction_ids: [],
    });

    setModalOuverte(true);
  }

  // ============================================================
  // OUVRIR MODIFICATION
  // ============================================================

  async function ouvrirEdition(utilisateur) {
    await chargerDonneesFormulaire();

    setModeEdition(true);
    setUtilisateurSelectionne(utilisateur);

    setFormulaire({
      membre_id: utilisateur.membre_id,
      identifiant: utilisateur.identifiant,
      mot_de_passe: "",
      fonction_ids:
        utilisateur.fonctions?.map(
          (fonction) => fonction.id
        ) || [],
    });

    setModalOuverte(true);
  }

  // ============================================================
  // ENREGISTRER
  // ============================================================

  async function enregistrer(e) {
    e.preventDefault();

    try {
      setEnregistrement(true);
      setErreur("");

      if (!modeEdition) {
        if (!formulaire.membre_id) {
          throw new Error(
            "Veuillez sélectionner un membre."
          );
        }

        if (!formulaire.mot_de_passe) {
          throw new Error(
            "Veuillez saisir un mot de passe."
          );
        }

        await creerUtilisateur(formulaire);
      } else {
        await modifierUtilisateur(
          utilisateurSelectionne.id,
          {
            identifiant: formulaire.identifiant,
            fonction_ids: formulaire.fonction_ids,
          }
        );
      }

      setModalOuverte(false);

      await chargerUtilisateurs();
    } catch (error) {
      console.error(error);

      setErreur(
        error.response?.data?.detail ||
          error.message ||
          "Une erreur est survenue."
      );
    } finally {
      setEnregistrement(false);
    }
  }

  // ============================================================
  // MOT DE PASSE
  // ============================================================

  function ouvrirMotDePasse(utilisateur) {
    setUtilisateurSelectionne(utilisateur);
    setMotDePasse("");
    setModalMotDePasse(true);
  }

  async function enregistrerMotDePasse(e) {
    e.preventDefault();

    if (!motDePasse.trim()) {
      return;
    }

    try {
      setEnregistrement(true);
      setErreur("");

      await modifierMotDePasse(
        utilisateurSelectionne.id,
        motDePasse
      );

      setModalMotDePasse(false);
      setMotDePasse("");

      await chargerUtilisateurs();
    } catch (error) {
      console.error(error);

      setErreur(
        error.response?.data?.detail ||
          "Impossible de modifier le mot de passe."
      );
    } finally {
      setEnregistrement(false);
    }
  }

  // ============================================================
  // DÉSACTIVER
  // ============================================================

  async function desactiver(utilisateur) {
    const confirmation = window.confirm(
      `Voulez-vous désactiver le compte "${utilisateur.identifiant}" ?`
    );

    if (!confirmation) {
      return;
    }

    try {
      await desactiverUtilisateur(
        utilisateur.id
      );

      await chargerUtilisateurs();
    } catch (error) {
      console.error(error);

      setErreur(
        error.response?.data?.detail ||
          "Impossible de désactiver l'utilisateur."
      );
    }
  }

  // ============================================================
  // RÉACTIVER
  // ============================================================

  async function activer(utilisateur) {
    try {
      await activerUtilisateur(
        utilisateur.id
      );

      await chargerUtilisateurs();
    } catch (error) {
      console.error(error);

      setErreur(
        error.response?.data?.detail ||
          "Impossible de réactiver l'utilisateur."
      );
    }
  }

  // ============================================================
  // AFFICHAGE
  // ============================================================

  return (
    <div className="space-y-8">

      {/* ====================================================== */}
      {/* EN-TÊTE                                                */}
      {/* ====================================================== */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>

          <p className="text-sm font-medium text-emerald-700">
            Administration
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Utilisateurs
          </h1>

          <p className="mt-2 text-slate-500">
            Gestion des comptes et des accès au système.
          </p>

        </div>

        <button
          onClick={ouvrirCreation}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-800"
        >
          <Plus size={19} />

          Nouvel utilisateur
        </button>

      </div>


      {/* ====================================================== */}
      {/* ERREUR                                                 */}
      {/* ====================================================== */}

      {erreur && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          <span>{erreur}</span>

          <button
            onClick={() => setErreur("")}
          >
            <X size={18} />
          </button>

        </div>
      )}


      {/* ====================================================== */}
      {/* FILTRES                                                */}
      {/* ====================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div className="relative flex-1">

            <Search
              size={19}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={recherche}
              onChange={(e) =>
                setRecherche(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  chargerUtilisateurs();
                }
              }}
              placeholder="Rechercher un identifiant..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />

          </div>

          <div className="flex gap-3">

            <label className="flex items-center gap-2 text-sm text-slate-600">

              <input
                type="checkbox"
                checked={inclureInactifs}
                onChange={(e) =>
                  setInclureInactifs(
                    e.target.checked
                  )
                }
                className="h-4 w-4 rounded border-slate-300"
              />

              Inclure les inactifs

            </label>

            <button
              onClick={chargerUtilisateurs}
              className="rounded-xl border border-slate-200 p-3 text-slate-600 transition hover:bg-slate-50"
              title="Actualiser"
            >
              <RefreshCw size={18} />
            </button>

          </div>

        </div>

      </div>


      {/* ====================================================== */}
      {/* TABLEAU                                                */}
      {/* ====================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {chargement ? (

          <div className="flex min-h-[300px] items-center justify-center">

            <div className="text-center">

              <RefreshCw
                size={30}
                className="mx-auto mb-3 animate-spin text-emerald-700"
              />

              <p className="text-slate-500">
                Chargement des utilisateurs...
              </p>

            </div>

          </div>

        ) : utilisateurs.length === 0 ? (

          <div className="p-12 text-center">

            <Users
              size={42}
              className="mx-auto mb-4 text-slate-300"
            />

            <h3 className="font-semibold text-slate-700">
              Aucun utilisateur
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Aucun compte utilisateur ne correspond
              à votre recherche.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="border-b border-slate-200 bg-slate-50">

                <tr>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Utilisateur
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Fonctions
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Statut
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {utilisateurs.map((utilisateur) => (

                  <tr
                    key={utilisateur.id}
                    className="transition hover:bg-slate-50"
                  >

                    {/* UTILISATEUR */}

                    <td className="px-6 py-4">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800">

                          {utilisateur.identifiant
                            ?.charAt(0)
                            .toUpperCase()}

                        </div>

                        <div>

                          <p className="font-semibold text-slate-800">
                            {utilisateur.identifiant}
                          </p>

                          <p className="text-xs text-slate-400">
                            Membre #{utilisateur.membre_id}
                          </p>

                        </div>

                      </div>

                    </td>


                    {/* FONCTIONS */}

                    <td className="px-6 py-4">

                      <div className="flex flex-wrap gap-2">

                        {utilisateur.fonctions?.length ? (

                          utilisateur.fonctions.map(
                            (fonction) => (

                              <span
                                key={fonction.id}
                                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                              >

                                <ShieldCheck size={13} />

                                {fonction.nom}

                              </span>

                            )
                          )

                        ) : (

                          <span className="text-sm text-slate-400">
                            Aucune fonction
                          </span>

                        )}

                      </div>

                    </td>


                    {/* STATUT */}

                    <td className="px-6 py-4">

                      {utilisateur.actif ? (

                        <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Actif
                        </span>

                      ) : (

                        <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                          Inactif
                        </span>

                      )}

                    </td>


                    {/* ACTIONS */}

                    <td className="px-6 py-4">

                      <div className="flex justify-end gap-2">

                        <button
                          onClick={() =>
                            ouvrirEdition(
                              utilisateur
                            )
                          }
                          title="Modifier"
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() =>
                            ouvrirMotDePasse(
                              utilisateur
                            )
                          }
                          title="Modifier le mot de passe"
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-amber-50 hover:text-amber-700"
                        >
                          <KeyRound size={17} />
                        </button>

                        {utilisateur.actif ? (

                          <button
                            onClick={() =>
                              desactiver(
                                utilisateur
                              )
                            }
                            title="Désactiver"
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <UserX size={17} />
                          </button>

                        ) : (

                          <button
                            onClick={() =>
                              activer(
                                utilisateur
                              )
                            }
                            title="Réactiver"
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            <UserCheck size={17} />
                          </button>

                        )}

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* ====================================================== */}
      {/* MODAL UTILISATEUR                                      */}
      {/* ====================================================== */}

      {modalOuverte && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-slate-900">

                  {modeEdition
                    ? "Modifier l'utilisateur"
                    : "Créer un utilisateur"}

                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Gestion du compte et des fonctions.
                </p>

              </div>

              <button
                onClick={() =>
                  setModalOuverte(false)
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>

            </div>


            <form
              onSubmit={enregistrer}
              className="space-y-5 p-6"
            >

              {/* MEMBRE */}

              {!modeEdition && (

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Membre
                  </label>

                  <select
                    name="membre_id"
                    value={formulaire.membre_id}
                    onChange={modifierChamp}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >

                    <option value="">
                      Sélectionner un membre
                    </option>

                    {membres.map((membre) => (

                      <option
                        key={membre.id}
                        value={membre.id}
                      >
                        {membre.prenom} {membre.nom} —{" "}
                        {membre.telephone}
                      </option>

                    ))}

                  </select>

                </div>

              )}


              {/* IDENTIFIANT */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Identifiant
                </label>

                <input
                  type="text"
                  name="identifiant"
                  value={formulaire.identifiant}
                  onChange={modifierChamp}
                  required
                  placeholder="Ex : moustapha.diallo"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

              </div>


              {/* MOT DE PASSE */}

              {!modeEdition && (

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Mot de passe initial
                  </label>

                  <input
                    type="password"
                    name="mot_de_passe"
                    value={formulaire.mot_de_passe}
                    onChange={modifierChamp}
                    required
                    placeholder="Mot de passe"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />

                  <p className="mt-1 text-xs text-slate-400">
                    Le membre pourra changer son mot de passe
                    lors de sa première connexion.
                  </p>

                </div>

              )}


              {/* FONCTIONS */}

              <div>

                <label className="mb-3 block text-sm font-semibold text-slate-700">
                  Fonctions
                </label>

                {fonctions.length === 0 ? (

                  <p className="text-sm text-slate-400">
                    Aucune fonction disponible.
                  </p>

                ) : (

                  <div className="grid gap-2 sm:grid-cols-2">

                    {fonctions.map((fonction) => {

                      const selectionnee =
                        formulaire.fonction_ids.includes(
                          fonction.id
                        );

                      return (

                        <button
                          type="button"
                          key={fonction.id}
                          onClick={() =>
                            toggleFonction(
                              fonction.id
                            )
                          }
                          className={`rounded-xl border p-4 text-left transition ${
                            selectionnee
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-slate-200 hover:bg-slate-50"
                          }`}
                        >

                          <div className="flex items-center gap-3">

                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded border ${
                                selectionnee
                                  ? "border-emerald-600 bg-emerald-600 text-white"
                                  : "border-slate-300"
                              }`}
                            >
                              {selectionnee && "✓"}
                            </div>

                            <div>

                              <p className="font-semibold text-slate-800">
                                {fonction.nom}
                              </p>

                              {fonction.description && (
                                <p className="mt-1 text-xs text-slate-400">
                                  {fonction.description}
                                </p>
                              )}

                            </div>

                          </div>

                        </button>

                      );
                    })}

                  </div>

                )}

              </div>


              {/* BOUTONS */}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">

                <button
                  type="button"
                  onClick={() =>
                    setModalOuverte(false)
                  }
                  className="rounded-xl border border-slate-200 px-5 py-3 font-medium text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={enregistrement}
                  className="rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  {enregistrement
                    ? "Enregistrement..."
                    : modeEdition
                    ? "Enregistrer"
                    : "Créer le compte"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* ====================================================== */}
      {/* MODAL MOT DE PASSE                                     */}
      {/* ====================================================== */}

      {modalMotDePasse && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  Modifier le mot de passe
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  {utilisateurSelectionne?.identifiant}
                </p>

              </div>

              <button
                onClick={() =>
                  setModalMotDePasse(false)
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={enregistrerMotDePasse}
              className="space-y-5 p-6"
            >

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Nouveau mot de passe
                </label>

                <input
                  type="password"
                  value={motDePasse}
                  onChange={(e) =>
                    setMotDePasse(e.target.value)
                  }
                  required
                  autoFocus
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

              </div>

              <div className="flex justify-end gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setModalMotDePasse(false)
                  }
                  className="rounded-xl border border-slate-200 px-5 py-3 font-medium text-slate-600"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={enregistrement}
                  className="rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white disabled:opacity-50"
                >
                  Modifier
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Utilisateurs;