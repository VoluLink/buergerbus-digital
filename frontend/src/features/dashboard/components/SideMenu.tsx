import {
  Bus,
  MapPin,
  Settings,
  UserRound,
  UserRoundPlus,
  X,
} from "lucide-react";

type SideMenuProps = {
  isOpen: boolean;
  isFahrer: boolean;
  isGast: boolean;
  canManageInitiatives: boolean;
  closeSideMenu: () => void;
  goToPage: (path: string) => void;
};

export function SideMenu({
  isOpen,
  isFahrer,
  isGast,
  canManageInitiatives,
  closeSideMenu,
  goToPage,
}: SideMenuProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-30 bg-slate-900/45 backdrop-blur-[2px]"
      onClick={closeSideMenu}
    >
      <aside
        className="h-full w-full max-w-sm bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        aria-label="Seitliche Navigation"
      >
        <div className="flex items-center justify-between bg-[#0053a0] px-6 py-5 text-white">
          <h2 className="text-4xl font-semibold tracking-tight">Navigation</h2>

          <button
            type="button"
            onClick={closeSideMenu}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-white transition hover:bg-white/10"
            aria-label="Navigation schließen"
          >
            <X className="h-7 w-7" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3 p-4">
          <button
            type="button"
            onClick={() => goToPage("/dashboard")}
            className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0] px-4 py-3 text-left text-lg font-medium text-white"
          >
            <Bus className="h-5 w-5" aria-hidden="true" />
            Dashboard
          </button>

          {!isFahrer && !isGast ? (
            <button
              type="button"
              onClick={() => goToPage("/fahrerinfos")}
              className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
            >
              <UserRound className="h-5 w-5" aria-hidden="true" />
              Fahrerinfos
            </button>
          ) : null}

          {!isGast ? (
            <button
              type="button"
              onClick={() => goToPage("/fahrzeuginfos")}
              className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
            >
              <Bus className="h-5 w-5" aria-hidden="true" />
              Fahrzeuginfos
            </button>
          ) : null}

          {!isFahrer && !isGast ? (
            <button
              type="button"
              onClick={() => goToPage("/fahrgastinfos")}
              className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
            >
              <UserRoundPlus className="h-5 w-5" aria-hidden="true" />
              Fahrgastinfos
            </button>
          ) : null}

          {canManageInitiatives ? (
            <button
              type="button"
              onClick={() => goToPage("/initiativen")}
              className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
            >
              <MapPin className="h-5 w-5" aria-hidden="true" />
              Initiativen
            </button>
          ) : null}

          {!isFahrer && !isGast ? (
            <button
              type="button"
              onClick={() => goToPage("/rollenverteilung")}
              className="flex w-full items-center gap-3 rounded-2xl bg-[#0053a0]/12 px-4 py-3 text-left text-lg font-medium text-[#0053a0]"
            >
              <Settings className="h-5 w-5" aria-hidden="true" />
              Rollenverteilung
            </button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
