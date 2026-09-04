
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";

// ============================================================
// PAGES GÉNÉRALES
// ============================================================

import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

// ============================================================
// LAYOUT
// ============================================================

import Layout from "./components/Layout";

// ============================================================
// MEMBRES / UTILISATEURS
// ============================================================

import Membres from "./pages/Membres";
import Utilisateurs from "./pages/Utilisateurs";

// ============================================================
// ESPACE PERSONNEL
// ============================================================

import MonEspace from "./pages/MonEspace";

// ============================================================
// KOUREL
// ============================================================

import Kourels from "./pages/Kourels";
import KourelDetails from "./pages/KourelDetails";
import MonKourel from "./pages/MonKourel";

// ============================================================
// KHASSIDAS / RÉPÉTITIONS
// ============================================================

import Khassidas from "./pages/Khassidas";
import Repetitions from "./pages/Repetitions";
import ProgrammeKourel from "./pages/ProgrammeKourel";
import RepetitionDetails from "./pages/RepetitionDetails";

// ============================================================
// FINANCES
// ============================================================

import Cotisations from "./pages/Cotisations";
import Paiements from "./pages/Paiements";
import Finances from "./pages/Finances";

// ============================================================
// ACTIVITÉS
// ============================================================

import Reunions from "./pages/Reunions";
import ProgrammeReligieux from "./pages/ProgrammeReligieux";
import Communication from "./pages/Communication";
import Notifications from "./pages/Notifications";
import Galerie from "./pages/Galerie";

/*
|--------------------------------------------------------------------------
| ROUTE PRIVÉE
|--------------------------------------------------------------------------
|
| Vérifie qu'un utilisateur est connecté.
|
| Toutes les routes placées à l'intérieur de cette route bénéficient
| automatiquement du Layout principal.
|
*/

function RoutePrivee() {
  const { utilisateur } = useAuth();

  if (!utilisateur) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <Layout />;
}

/*
|--------------------------------------------------------------------------
| ROUTE AVEC PERMISSION
|--------------------------------------------------------------------------
|
| Vérifie qu'un utilisateur possède une permission précise.
|
| Exemple :
|
| <RoutePermission permission="MEMBRE_CONSULTER">
|   <Membres />
| </RoutePermission>
|
*/

function RoutePermission({
  permission,
  children,
  fallback = "/mon-espace",
}) {
  const { utilisateur } = useAuth();

  // Utilisateur non connecté
  if (!utilisateur) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // Récupération sécurisée des permissions
  const permissions = Array.isArray(
    utilisateur.permissions
  )
    ? utilisateur.permissions
    : [];

  // Vérification de la permission
  const autorise = permissions.some(
    (item) =>
      item?.code === permission
  );

  console.log(
    `[RoutePermission] ${permission} :`,
    autorise
  );

  // Permission refusée
  if (!autorise) {
    return (
      <Navigate
        to={fallback}
        replace
      />
    );
  }

  return children;
}

/*
|--------------------------------------------------------------------------
| ROUTE FINANCES
|--------------------------------------------------------------------------
|
| L'espace Finances est accessible si l'utilisateur possède AU MOINS
| une des permissions financières suivantes.
|
*/

function RouteFinance({ children }) {
  const { utilisateur } = useAuth();

  if (!utilisateur) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  const permissions = Array.isArray(
    utilisateur.permissions
  )
    ? utilisateur.permissions
    : [];

  const permissionsFinance = [
    "DEPENSE_CONSULTER",
    "AIDE_EXTERIEURE_CONSULTER",
    "COTISATION_CONSULTER",
    "PAIEMENT_CONSULTER",
  ];

  const autorise = permissions.some(
    (item) =>
      permissionsFinance.includes(
        item?.code
      )
  );

  if (!autorise) {
    return (
      <Navigate
        to="/mon-espace"
        replace
      />
    );
  }

  return children;
}

/*
|--------------------------------------------------------------------------
| ROUTE MEMBRE DU KOUREL
|--------------------------------------------------------------------------
|
| Vérifie que l'utilisateur appartient réellement à au moins un Kourel.
|
| Deux possibilités sont acceptées :
|
| 1. utilisateur.est_membre_kourel === true
| 2. utilisateur.kourels contient au moins un élément
|
*/

function RouteKourel({ children }) {
  const { utilisateur } = useAuth();

  if (!utilisateur) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  const kourels = Array.isArray(
    utilisateur.kourels
  )
    ? utilisateur.kourels
    : [];

  const estMembreKourel =
    utilisateur.est_membre_kourel === true ||
    kourels.length > 0;

  if (!estMembreKourel) {
    return (
      <Navigate
        to="/mon-espace"
        replace
      />
    );
  }

  return children;
}

/*
|--------------------------------------------------------------------------
| ROUTE DASHBOARD
|--------------------------------------------------------------------------
|
| Le Dashboard général est réservé aux fonctions autorisées.
|
*/

function RouteDashboard() {
  const { utilisateur } = useAuth();

  if (!utilisateur) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  const fonctions = Array.isArray(
    utilisateur.fonctions
  )
    ? utilisateur.fonctions
    : [];

  const fonctionsAutorisees = [
  "ADMINISTRATEUR",
  "SG",
  "ADJOINT_SG",
  "DIEUWRIGNE",
  "RESPONSABLE_FINANCIER",
  "ADJOINT_FINANCIER",
];

  const autorise = fonctions.some(
    (fonction) =>
      fonctionsAutorisees.includes(
        fonction?.nom
      )
  );

  if (!autorise) {
    return (
      <Navigate
        to="/mon-espace"
        replace
      />
    );
  }

  return <Dashboard />;
}

/*
|--------------------------------------------------------------------------
| APPLICATION
|--------------------------------------------------------------------------
*/

function App() {
  const {
    utilisateur,
    chargement,
  } = useAuth();

  /*
  |--------------------------------------------------------------------------
  | CHARGEMENT INITIAL
  |--------------------------------------------------------------------------
  |
  | Tant que AuthContext vérifie la session utilisateur, on affiche
  | un écran de chargement.
  |
  */

  if (chargement) {
    return (
      <div
        className="
          flex min-h-screen
          items-center justify-center
          bg-slate-100
        "
      >
        <div className="text-center">

          <div
            className="
              mx-auto h-10 w-10
              animate-spin rounded-full
              border-4 border-emerald-200
              border-t-emerald-900
            "
          />

          <p
            className="
              mt-4 text-sm
              text-slate-500
            "
          >
            Chargement de votre espace...
          </p>

        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | UTILISATEUR CONNECTÉ
  |--------------------------------------------------------------------------
  */

  const connecte = Boolean(utilisateur);

  return (
    <BrowserRouter>

      <Routes>

        {/* ==========================================================
            ACCUEIL
        ========================================================== */}

        <Route
          path="/"
          element={<Home />}
        />

        {/* ==========================================================
            CONNEXION
        ========================================================== */}

        <Route
          path="/login"
          element={
            connecte ? (
              <Navigate
                to="/mon-espace"
                replace
              />
            ) : (
              <Login />
            )
          }
        />

        {/* ==========================================================
            ESPACE PERSONNEL
        ========================================================== */}

        <Route
          path="/mon-espace"
          element={
            connecte ? (
              <MonEspace />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        {/* ==========================================================
            ROUTES PRIVÉES
        ========================================================== */}

        <Route
          element={<RoutePrivee />}
        >

          {/* ========================================================
              DASHBOARD
          ======================================================== */}

          <Route
            path="/dashboard"
            element={
              <RouteDashboard />
            }
          />

          {/* ========================================================
              UTILISATEURS
          ======================================================== */}

          <Route
            path="/utilisateurs"
            element={
              <RoutePermission
                permission="UTILISATEUR_CONSULTER"
              >
                <Utilisateurs />
              </RoutePermission>
            }
          />

          {/* ========================================================
              MEMBRES
          ======================================================== */}

          <Route
            path="/membres"
            element={
              <RoutePermission
                permission="MEMBRE_CONSULTER"
              >
                <Membres />
              </RoutePermission>
            }
          />

          {/* ========================================================
              COTISATIONS
          ======================================================== */}

          <Route
            path="/cotisations"
            element={
              <RoutePermission
                permission="COTISATION_CONSULTER"
              >
                <Cotisations />
              </RoutePermission>
            }
          />

          {/* ========================================================
              PAIEMENTS
          ======================================================== */}

          <Route
            path="/paiements"
            element={
              <RoutePermission
                permission="PAIEMENT_CONSULTER"
              >
                <Paiements />
              </RoutePermission>
            }
          />

          {/* ========================================================
              FINANCES
          ======================================================== */}

          <Route
            path="/finances"
            element={
              <RouteFinance>
                <Finances />
              </RouteFinance>
            }
          />

          {/* ========================================================
              RÉUNIONS
          ======================================================== */}

          <Route
            path="/reunions"
            element={
              <RoutePermission
                permission="REUNION_CONSULTER"
              >
                <Reunions />
              </RoutePermission>
            }
          />

          {/* ========================================================
              PROGRAMME RELIGIEUX
          ======================================================== */}

          <Route
  path="/programme-religieux"
  element={
    <RoutePermission
      permission="KOUREL_CONSULTER"
    >
      <RouteKourel>
        <ProgrammeReligieux />
      </RouteKourel>
    </RoutePermission>
  }
/>

          {/* ========================================================
              COMMUNICATIONS
          ======================================================== */}

          <Route
            path="/communications"
            element={
              <RoutePermission
                permission="COMMUNICATION_CONSULTER"
              >
                <Communication />
              </RoutePermission>
            }
          />

          {/* ========================================================
    GALERIE
======================================================== */}

<Route
  path="/galerie"
  element={
    <RoutePermission
      permission="GALERIE_CONSULTER"
    >
      <Galerie />
    </RoutePermission>
  }
/>

          {/* ========================================================
              NOTIFICATIONS
          ======================================================== */}

          <Route
  path="/notifications"
  element={
    <RoutePermission
      permission="NOTIFICATION_CONSULTER"
    >
      <Notifications />
    </RoutePermission>
  }
/>

          {/* ========================================================
              MON KOUREL
          ======================================================== */}

          <Route
            path="/mon-kourel"
            element={
              <RoutePermission
                permission="KOUREL_CONSULTER"
              >
                <RouteKourel>
                  <MonKourel />
                </RouteKourel>
              </RoutePermission>
            }
          />

          {/* ========================================================
              PROGRAMME DU KOUREL
          ======================================================== */}

          <Route
            path="/programme-kourel"
            element={
              <RoutePermission
                permission="KOUREL_CONSULTER"
              >
                <RouteKourel>
                  <ProgrammeKourel />
                </RouteKourel>
              </RoutePermission>
            }
          />

          {/* ========================================================
              DÉTAIL D'UNE RÉPÉTITION
          ======================================================== */}

          <Route
            path="/programme-kourel/repetitions/:id"
            element={
              <RoutePermission
                permission="KOUREL_CONSULTER"
              >
                <RouteKourel>
                  <RepetitionDetails />
                </RouteKourel>
              </RoutePermission>
            }
          />

          {/* ========================================================
              RÉPÉTITIONS
          ======================================================== */}

          <Route
            path="/repetitions"
            element={
              <RoutePermission
                permission="KOUREL_CONSULTER"
              >
                <RouteKourel>
                  <Repetitions />
                </RouteKourel>
              </RoutePermission>
            }
          />

          {/* ========================================================
              KHASSIDAS
          ======================================================== */}

          <Route
            path="/khassidas"
            element={
              <RoutePermission
                permission="KOUREL_CONSULTER"
              >
                <RouteKourel>
                  <Khassidas />
                </RouteKourel>
              </RoutePermission>
            }
          />

          {/* ========================================================
              KOURELS
          ======================================================== */}

          <Route
            path="/kourels"
            element={
              <RoutePermission
                permission="KOUREL_CONSULTER"
              >
                <Kourels />
              </RoutePermission>
            }
          />

          {/* ========================================================
              DÉTAIL KOUREL
          ======================================================== */}

          <Route
            path="/kourels/:id"
            element={
              <RoutePermission
                permission="KOUREL_CONSULTER"
              >
                <KourelDetails />
              </RoutePermission>
            }
          />

        </Route>

        {/* ==========================================================
            ROUTE INCONNUE
        ========================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;
