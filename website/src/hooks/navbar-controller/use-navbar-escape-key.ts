import { useEffect } from "react";
import type { NavbarPhase } from "@/hooks/use-navbar-phase";

type UseNavbarEscapeKeyOptions = {
  onEscape: () => void;
  phase: NavbarPhase;
};

export function useNavbarEscapeKey({ onEscape, phase }: UseNavbarEscapeKeyOptions) {
  useEffect(() => {
    if (phase === "closed") {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onEscape();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onEscape, phase]);
}
