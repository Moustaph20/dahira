import { useEffect, useMemo, useRef, useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  Wallet,
  CalendarDays,
  BookOpen,
  LogOut,
  Menu,
  X,
  Home,
  Megaphone,
  Bell,
  Music,
  ChevronRight,
  Sparkles,
  Search,
  CircleUserRound,
  Clock3,
  Star,
  UserCog,
  CreditCard,
  Receipt,
  CalendarCheck,
  Globe2,
  Images,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

// ============================================================
// RUBRIQUES KOURÉL
// ============================================================

const RUBRIQUES_KOUREL = [
  {
    to: "/mon-kourel",
    label: "Mon Kourel",
    icon: Users,
    permission: "KOUREL_CONSULTER",
    couleur: "amber",
  },
  {
    to: "/programme-religieux",
    label: "Programme religieux",
    icon: CalendarDays,
    permission: "KOUREL_CONSULTER",
    couleur: "amber",
  },
  {
    to: "/khassidas",
    label: "Khassidas",
    icon: BookOpen,
    permission: "KOUREL_CONSULTER",
    couleur: "amber",
  },
];

// ============================================================
// COULEURS MENU
// ============================================================

const COULEURS_MENU = {
  emerald: {
    actif:
      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    icone:
      "bg-emerald-100 text-emerald-700",
  },

  blue: {
    actif:
      "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
    icone:
      "bg-blue-100 text-blue-700",
  },

  violet: {
    actif:
      "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
    icone:
      "bg-violet-100 text-violet-700",
  },

  amber: {
    actif:
      "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    icone:
      "bg-amber-100 text-amber-700",
  },

  rose: {
    actif:
      "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
    icone:
      "bg-rose-100 text-rose-700",
  },

  cyan: {
    actif:
      "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100",
    icone:
      "bg-cyan-100 text-cyan-700",
  },
};

// ============================================================
// COMPOSANT ITEM NAVIGATION
// ============================================================

function NavigationItem({
  to,
  label,
  icon: Icon,
  couleur = "emerald",
  onNavigate,
}) {
  const couleurs =
    COULEURS_MENU[couleur] || COULEURS_MENU.emerald;

  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          "group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5",
          "text-sm font-medium transition-all duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40",
          isActive
            ? couleurs.actif
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={[
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
              "transition-all duration-200",
              isActive
                ? couleurs.icone
                : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700",
            ].join(" ")}
          >
            <Icon size={18} strokeWidth={2} />
          </span>

          <span className="min-w-0 flex-1 truncate">
            {label}
          </span>

          <ChevronRight
            size={16}
            className={[
              "shrink-0 transition-all duration-200",
              isActive
                ? "translate-x-0 opacity-100"
                : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-60",
            ].join(" ")}
          />
        </>
      )}
    </NavLink>
  );
}

// ============================================================
// TITRE DE SECTION
// ============================================================

function SectionTitre({ children }) {
  return (
    <div className="px-3 pb-2 pt-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
        {children}
      </p>
    </div>
  );
}

// ============================================================
// LAYOUT
// ============================================================

export default function Layout() {
  const { utilisateur, deconnexion } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  const [menuOuvert, setMenuOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");

  // ----------------------------------------------------------
  // RÉFÉRENCES DE SCROLL
  // ----------------------------------------------------------

  const mainRef = useRef(null);
  const navigationScrollRef = useRef(null);

  // ----------------------------------------------------------
  // PERMISSIONS
  // ----------------------------------------------------------

  const possedePermission = (permission) => {
    if (!permission) {
      return true;
    }

    return (
      utilisateur?.permissions?.includes(permission) ||
      utilisateur?.permission_codes?.includes(permission)
    );
  };

  // ----------------------------------------------------------
  // INFORMATIONS UTILISATEUR
  // ----------------------------------------------------------

  const nomUtilisateur =
    utilisateur?.nom_complet ||
    utilisateur?.nom ||
    utilisateur?.username ||
    utilisateur?.identifiant ||
    "Utilisateur";

  const premiereLettre =
    nomUtilisateur?.charAt(0)?.toUpperCase() || "U";

  const fonctionsUtilisateur =
    utilisateur?.fonctions || [];

  const estMembreKourel =
    Boolean(utilisateur?.kourels?.length) ||
    Boolean(utilisateur?.est_membre_kourel);

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const navigationDashboard = useMemo(
    () => [
      {
        to: "/dashboard",
        label: "Tableau de bord",
        icon: LayoutDashboard,
        permission: "DASHBOARD_CONSULTER",
        couleur: "emerald",
      },
    ],
    []
  );

  const navigationAdministration = useMemo(
    () => [
      {
        to: "/utilisateurs",
        label: "Utilisateurs",
        icon: UserCog,
        permission: "UTILISATEUR_CONSULTER",
        couleur: "violet",
      },
      {
        to: "/galerie",
        label: "Galerie",
        icon: Images,
        permission: "GALERIE_CONSULTER",
        couleur: "violet",
      },
    ],
    []
  );

  const navigationMembres = useMemo(
    () => [
      {
        to: "/membres",
        label: "Membres",
        icon: Users,
        permission: "MEMBRE_CONSULTER",
        couleur: "blue",
      },
    ],
    []
  );

  const navigationFinances = useMemo(
    () => [
      {
        to: "/cotisations",
        label: "Cotisations",
        icon: Wallet,
        permission: "COTISATION_CONSULTER",
        couleur: "emerald",
      },
      {
        to: "/paiements",
        label: "Paiements",
        icon: CreditCard,
        permission: "PAIEMENT_CONSULTER",
        couleur: "blue",
      },
      {
        to: "/finances",
        label: "Finances",
        icon: Receipt,
        permission: null,
        permissions: [
          "DEPENSE_CONSULTER",
          "AIDE_EXTERIEURE_CONSULTER",
        ],
        couleur: "rose",
      },
    ],
    []
  );

  const navigationActivites = useMemo(
    () => [
      {
        to: "/reunions",
        label: "Réunions",
        icon: CalendarCheck,
        permission: null,
        couleur: "cyan",
      },
      {
        to: "/repetitions",
        label: "Répétitions",
        icon: Music,
        permission: "KOUREL_CONSULTER",
        couleur: "amber",
      },
    ],
    []
  );

  const navigationCommunication = useMemo(
    () => [
      {
        to: "/communication",
        label: "Communication",
        icon: Megaphone,
        permission: "COMMUNICATION_CONSULTER",
        couleur: "violet",
      },
    ],
    []
  );

  const navigationRelations = useMemo(
    () => [
      {
        to: "/relations-exterieures",
        label: "Relations extérieures",
        icon: Globe2,
        permission: "RELATION_EXTERIEUR_CONSULTER",
        couleur: "cyan",
      },
    ],
    []
  );

  const navigationNotifications = useMemo(
    () => [
      {
        to: "/notifications",
        label: "Notifications",
        icon: Bell,
        permission: "NOTIFICATION_CONSULTER",
        couleur: "rose",
      },
    ],
    []
  );

  // ==========================================================
  // AUTORISATION D'UNE RUBRIQUE
  // ==========================================================

  const itemAutorise = (item) => {
    // Une liste de permissions signifie :
    // l'utilisateur doit avoir au moins une des permissions.
    if (
      Array.isArray(item.permissions) &&
      item.permissions.length > 0
    ) {
      return item.permissions.some((permission) =>
        possedePermission(permission)
      );
    }

    if (item.permission) {
      return possedePermission(item.permission);
    }

    return true;
  };

  // ==========================================================
  // FILTRAGE RECHERCHE
  // ==========================================================

  const filtrerNavigation = (items) => {
    const autorises = items.filter(itemAutorise);

    const terme = recherche.trim().toLowerCase();

    if (!terme) {
      return autorises;
    }

    return autorises.filter((item) =>
      item.label.toLowerCase().includes(terme)
    );
  };

  // ==========================================================
  // NAVIGATION AFFICHÉE
  // ==========================================================

  const navigation = useMemo(() => {
    return {
      dashboard: filtrerNavigation(navigationDashboard),
      administration: filtrerNavigation(
        navigationAdministration
      ),
      membres: filtrerNavigation(navigationMembres),
      finances: filtrerNavigation(navigationFinances),
      activites: filtrerNavigation(navigationActivites),
      communication: filtrerNavigation(
        navigationCommunication
      ),
      relations: filtrerNavigation(navigationRelations),
      notifications: filtrerNavigation(
        navigationNotifications
      ),
      kourel: estMembreKourel
        ? filtrerNavigation(RUBRIQUES_KOUREL)
        : [],
    };
  }, [
    recherche,
    utilisateur,
    estMembreKourel,
    navigationDashboard,
    navigationAdministration,
    navigationMembres,
    navigationFinances,
    navigationActivites,
    navigationCommunication,
    navigationRelations,
    navigationNotifications,
  ]);

  // ==========================================================
  // TOUTES LES RUBRIQUES AUTORISÉES
  // IMPORTANT :
  // Cette liste ne dépend PAS de la recherche.
  // ==========================================================

  const toutesLesRubriques = useMemo(() => {
    const sections = [
      navigationDashboard,
      navigationAdministration,
      navigationMembres,
      navigationFinances,
      navigationActivites,
      navigationCommunication,
      navigationRelations,
      navigationNotifications,
      ...(estMembreKourel ? [RUBRIQUES_KOUREL] : []),
    ];

    return sections
      .flat()
      .filter(itemAutorise);
  }, [
    utilisateur,
    estMembreKourel,
    navigationDashboard,
    navigationAdministration,
    navigationMembres,
    navigationFinances,
    navigationActivites,
    navigationCommunication,
    navigationRelations,
    navigationNotifications,
  ]);

  // ==========================================================
  // TITRE DE PAGE
  // ==========================================================

  const titrePage = useMemo(() => {
    const pathname = location.pathname;

    if (
      pathname === "/" ||
      pathname === "/mon-espace"
    ) {
      return "Mon espace";
    }

    if (pathname.startsWith("/profil")) {
      return "Mon profil";
    }

    if (pathname.startsWith("/finances")) {
      return "Finances";
    }

    const rubrique = toutesLesRubriques.find(
      (item) => pathname === item.to
    );

    if (rubrique) {
      return rubrique.label;
    }

    const rubriqueParent = toutesLesRubriques.find(
      (item) =>
        pathname.startsWith(`${item.to}/`)
    );

    if (rubriqueParent) {
      return rubriqueParent.label;
    }

    return "Dahira";
  }, [
    location.pathname,
    toutesLesRubriques,
  ]);

  // ==========================================================
  // BADGE KOURÉL
  // ==========================================================

  const afficherBadgeKourel =
    location.pathname.includes("kourel") ||
    location.pathname.includes("khassida") ||
    location.pathname.includes("programme-religieux") ||
    location.pathname.includes("repetition");

  // ==========================================================
  // ACTIONS
  // ==========================================================

  const fermerMenu = () => {
    setMenuOuvert(false);
  };

  const ouvrirProfil = () => {
    fermerMenu();
    navigate("/profil");
  };

  const retourAccueil = () => {
    fermerMenu();
    navigate("/mon-espace");
  };

  const gererDeconnexion = async () => {
    try {
      await deconnexion();
    } finally {
      setMenuOuvert(false);
      navigate("/login", { replace: true });
    }
  };

  // ==========================================================
  // FERMETURE DU MENU APRÈS NAVIGATION
  // ==========================================================

  useEffect(() => {
    setMenuOuvert(false);
    setRecherche("");

    if (navigationScrollRef.current) {
      navigationScrollRef.current.scrollTop = 0;
    }
  }, [
    location.pathname,
    location.search,
    location.hash,
    location.key,
  ]);

  // ==========================================================
  // CORRECTION PRINCIPALE :
  // REMONTER LE CONTENU PRINCIPAL EN HAUT
  // APRÈS CHAQUE NAVIGATION
  // ==========================================================

  useEffect(() => {
    let frame1;
    let frame2;

    const remettreEnHaut = () => {
      // Scroll principal du navigateur
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });

      // Certains navigateurs conservent le scroll
      // sur html ou body.
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      // Sécurité supplémentaire si le main devient
      // un conteneur scrollable dans une page.
      if (mainRef.current) {
        mainRef.current.scrollTop = 0;
      }

      // Remettre aussi la navigation latérale en haut.
      if (navigationScrollRef.current) {
        navigationScrollRef.current.scrollTop = 0;
      }
    };

    // Premier passage après le changement de route.
    frame1 = requestAnimationFrame(() => {
      remettreEnHaut();

      // Deuxième passage après le rendu du contenu
      // de la nouvelle page.
      frame2 = requestAnimationFrame(() => {
        remettreEnHaut();
      });
    });

    return () => {
      cancelAnimationFrame(frame1);
      cancelAnimationFrame(frame2);
    };
  }, [
    location.pathname,
    location.search,
    location.hash,
    location.key,
  ]);

  // ==========================================================
  // VERROUILLAGE DU SCROLL LORSQUE LE MENU MOBILE EST OUVERT
  // ==========================================================

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    if (!menuOuvert) {
      return undefined;
    }

    const ancienOverflowHtml = html.style.overflow;
    const ancienOverflowBody = body.style.overflow;

    const ancienOverscrollHtml =
      html.style.overscrollBehavior;

    const ancienOverscrollBody =
      body.style.overscrollBehavior;

    const anciennePaddingRight =
      body.style.paddingRight;

    // Largeur éventuelle de la scrollbar.
    const largeurScrollbar =
      window.innerWidth - html.clientWidth;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    html.style.overscrollBehavior = "none";
    body.style.overscrollBehavior = "none";

    // Évite un décalage horizontal lorsque la scrollbar
    // disparaît.
    if (largeurScrollbar > 0) {
      body.style.paddingRight =
        `${largeurScrollbar}px`;
    }

    const gererTouche = (event) => {
      if (event.key === "Escape") {
        setMenuOuvert(false);
      }
    };

    window.addEventListener(
      "keydown",
      gererTouche
    );

    return () => {
      html.style.overflow =
        ancienOverflowHtml;

      body.style.overflow =
        ancienOverflowBody;

      html.style.overscrollBehavior =
        ancienOverscrollHtml;

      body.style.overscrollBehavior =
        ancienOverscrollBody;

      body.style.paddingRight =
        anciennePaddingRight;

      window.removeEventListener(
        "keydown",
        gererTouche
      );
    };
  }, [menuOuvert]);

  // ==========================================================
  // RÉSULTAT DE RECHERCHE
  // ==========================================================

  const aucunResultat =
    recherche.trim() &&
    Object.values(navigation).every(
      (items) => items.length === 0
    );

  // ==========================================================
  // RENDU
  // ==========================================================

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#f6f8f7] text-slate-900">

      {/* ======================================================
          OVERLAY MOBILE
      ====================================================== */}

      {menuOuvert && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={fermerMenu}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 w-[290px]",
          "transform transition-transform duration-300 ease-out",
          "lg:translate-x-0",
          menuOuvert
            ? "translate-x-0"
            : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white shadow-2xl lg:shadow-none">

          {/* --------------------------------------------------
              LOGO / ENTÊTE
          -------------------------------------------------- */}

          <div className="flex shrink-0 items-center justify-between px-5 pb-4 pt-5">
            <button
              type="button"
              onClick={retourAccueil}
              className="flex min-w-0 items-center gap-3 rounded-2xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                <Home
                  size={21}
                  strokeWidth={2.2}
                />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-slate-900">
                  Dahira
                </p>

                <p className="truncate text-[11px] font-medium text-slate-400">
                  Gestion &amp; organisation
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={fermerMenu}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
              aria-label="Fermer"
            >
              <X size={19} />
            </button>
          </div>

          {/* --------------------------------------------------
              PROFIL RAPIDE
          -------------------------------------------------- */}

          <div className="shrink-0 px-4 pb-4">
            <button
              type="button"
              onClick={ouvrirProfil}
              className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50/50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                {premiereLettre}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-800">
                  {nomUtilisateur}
                </p>

                <p className="truncate text-[11px] text-slate-500">
                  {fonctionsUtilisateur.length > 0
                    ? fonctionsUtilisateur[0]?.nom ||
                      fonctionsUtilisateur[0]
                    : "Membre"}
                </p>
              </div>

              <ChevronRight
                size={16}
                className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-600"
              />
            </button>
          </div>

          {/* --------------------------------------------------
              RECHERCHE
          -------------------------------------------------- */}

          <div className="shrink-0 px-4 pb-3">
            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={recherche}
                onChange={(event) =>
                  setRecherche(event.target.value)
                }
                placeholder="Rechercher..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
              />
            </div>
          </div>

          {/* --------------------------------------------------
              NAVIGATION
          -------------------------------------------------- */}

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[28px] bg-white">
            <nav
              ref={navigationScrollRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6"
            >
              {/* TABLEAU DE BORD */}

              {navigation.dashboard.length > 0 && (
                <>
                  <SectionTitre>
                    Principal
                  </SectionTitre>

                  <div className="space-y-1">
                    {navigation.dashboard.map(
                      (item) => (
                        <NavigationItem
                          key={item.to}
                          {...item}
                          onNavigate={fermerMenu}
                        />
                      )
                    )}
                  </div>
                </>
              )}

              {/* ADMINISTRATION */}

              {navigation.administration.length >
                0 && (
                <>
                  <SectionTitre>
                    Administration
                  </SectionTitre>

                  <div className="space-y-1">
                    {navigation.administration.map(
                      (item) => (
                        <NavigationItem
                          key={item.to}
                          {...item}
                          onNavigate={fermerMenu}
                        />
                      )
                    )}
                  </div>
                </>
              )}

              {/* MEMBRES */}

              {navigation.membres.length > 0 && (
                <>
                  <SectionTitre>
                    Membres
                  </SectionTitre>

                  <div className="space-y-1">
                    {navigation.membres.map(
                      (item) => (
                        <NavigationItem
                          key={item.to}
                          {...item}
                          onNavigate={fermerMenu}
                        />
                      )
                    )}
                  </div>
                </>
              )}

              {/* FINANCES */}

              {navigation.finances.length > 0 && (
                <>
                  <SectionTitre>
                    Finances
                  </SectionTitre>

                  <div className="space-y-1">
                    {navigation.finances.map(
                      (item) => (
                        <NavigationItem
                          key={item.to}
                          {...item}
                          onNavigate={fermerMenu}
                        />
                      )
                    )}
                  </div>
                </>
              )}

              {/* ACTIVITÉS */}

              {navigation.activites.length > 0 && (
                <>
                  <SectionTitre>
                    Activités
                  </SectionTitre>

                  <div className="space-y-1">
                    {navigation.activites.map(
                      (item) => (
                        <NavigationItem
                          key={item.to}
                          {...item}
                          onNavigate={fermerMenu}
                        />
                      )
                    )}
                  </div>
                </>
              )}

              {/* KOURÉL */}

              {navigation.kourel.length > 0 && (
                <>
                  <SectionTitre>
                    Kourel
                  </SectionTitre>

                  <div className="space-y-1">
                    {navigation.kourel.map(
                      (item) => (
                        <NavigationItem
                          key={item.to}
                          {...item}
                          onNavigate={fermerMenu}
                        />
                      )
                    )}
                  </div>
                </>
              )}

              {/* COMMUNICATION */}

              {navigation.communication.length >
                0 && (
                <>
                  <SectionTitre>
                    Communication
                  </SectionTitre>

                  <div className="space-y-1">
                    {navigation.communication.map(
                      (item) => (
                        <NavigationItem
                          key={item.to}
                          {...item}
                          onNavigate={fermerMenu}
                        />
                      )
                    )}
                  </div>
                </>
              )}

              {/* RELATIONS EXTÉRIEURES */}

              {navigation.relations.length > 0 && (
                <>
                  <SectionTitre>
                    Relations
                  </SectionTitre>

                  <div className="space-y-1">
                    {navigation.relations.map(
                      (item) => (
                        <NavigationItem
                          key={item.to}
                          {...item}
                          onNavigate={fermerMenu}
                        />
                      )
                    )}
                  </div>
                </>
              )}

              {/* NOTIFICATIONS */}

              {navigation.notifications.length >
                0 && (
                <>
                  <SectionTitre>
                    Personnel
                  </SectionTitre>

                  <div className="space-y-1">
                    {navigation.notifications.map(
                      (item) => (
                        <NavigationItem
                          key={item.to}
                          {...item}
                          onNavigate={fermerMenu}
                        />
                      )
                    )}
                  </div>
                </>
              )}

              {/* AUCUN RÉSULTAT */}

              {aucunResultat && (
                <div className="px-3 py-8 text-center">
                  <Search
                    size={24}
                    className="mx-auto mb-2 text-slate-300"
                  />

                  <p className="text-sm font-semibold text-slate-500">
                    Aucun résultat
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Essayez un autre terme.
                  </p>
                </div>
              )}
            </nav>

            {/* ------------------------------------------------
                DÉCONNEXION
            ------------------------------------------------ */}

            <div className="shrink-0 border-t border-slate-100 bg-white p-4">
              <button
                type="button"
                onClick={gererDeconnexion}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-rose-50 hover:text-rose-600"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                  <LogOut size={18} />
                </span>

                <span>
                  Déconnexion
                </span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ======================================================
          CONTENU PRINCIPAL
      ====================================================== */}

      <main
        ref={mainRef}
        className="relative z-10 min-h-screen min-w-0 lg:ml-[290px]"
      >
        {/* ----------------------------------------------------
            HEADER
        ---------------------------------------------------- */}

        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
          <div className="flex min-h-[72px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

            {/* GAUCHE */}

            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setMenuOuvert(true)
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 lg:hidden"
                aria-label="Ouvrir le menu"
              >
                <Menu size={20} />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-lg font-extrabold text-slate-900 sm:text-xl">
                    {titrePage}
                  </h1>

                  {afficherBadgeKourel && (
                    <span className="hidden shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700 sm:inline-flex">
                      <Sparkles size={11} />
                      Kourel
                    </span>
                  )}
                </div>

                <p className="hidden truncate text-xs text-slate-400 sm:block">
                  Espace de gestion du Dahira
                </p>
              </div>
            </div>

            {/* DROITE */}

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  navigate("/notifications")
                }
                className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label="Notifications"
              >
                <Bell size={19} />
              </button>

              <button
                type="button"
                onClick={ouvrirProfil}
                className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-100"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                  {premiereLettre}
                </div>

                <div className="hidden max-w-[150px] text-left md:block">
                  <p className="truncate text-xs font-bold text-slate-800">
                    {nomUtilisateur}
                  </p>

                  <p className="truncate text-[10px] text-slate-400">
                    Mon profil
                  </p>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* ----------------------------------------------------
            CONTENU
        ---------------------------------------------------- */}

        <div className="w-full px-4 pb-8 pt-4 sm:px-6 lg:px-8">

          {/* Fil d'information */}

          <div className="mb-4 flex items-center gap-2 text-xs text-slate-400">
            <Clock3 size={13} />

            <span>
              Espace membre
            </span>

            <ChevronRight size={13} />

            <span className="font-medium text-slate-500">
              {titrePage}
            </span>
          </div>

          {/* OUTLET */}

          <section
            className="w-full min-w-0 overflow-visible rounded-[26px] border border-slate-200/80 bg-white shadow-sm"
          >
            <div className="min-w-0 p-4 sm:p-5 lg:p-6">
              <Outlet />
            </div>
          </section>
        </div>

        {/* ----------------------------------------------------
            FOOTER
        ---------------------------------------------------- */}

        <footer className="px-4 pb-8 pt-2 text-center sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center gap-1 text-[11px] text-slate-400 sm:flex-row sm:gap-2">
            <span>
              Dahira
            </span>

            <span className="hidden sm:inline">
              •
            </span>

            <span>
              Gestion &amp; organisation
            </span>

            <span className="hidden sm:inline">
              •
            </span>

            <span className="inline-flex items-center gap-1">
              <Star
                size={11}
                className="fill-current"
              />
              Baraka
            </span>
          </div>
        </footer>
      </main>

      {/* ======================================================
          STYLES GLOBAUX
      ====================================================== */}

      <style>{`
        html,
        body {
          max-width: 100%;
          overflow-x: hidden;
        }

        html {
          scroll-behavior: auto;
        }

        body {
          margin: 0;
        }

        * {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }

        *::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        *::-webkit-scrollbar-track {
          background: transparent;
        }

        *::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 999px;
        }

        *::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        @media (max-width: 1023px) {
          html,
          body {
            overflow-x: hidden;
          }
        }
      `}</style>
    </div>
  );
}