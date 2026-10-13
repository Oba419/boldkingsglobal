"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { THEME_STORAGE_KEY as KEY } from "@/lib/theme";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

const isDark = () => document.documentElement.classList.contains("dark");

export function ThemeToggle({ className }: { className?: string }) {
  // Null during SSR/hydration: render a neutral icon until the real theme is known.
  const dark = useSyncExternalStore(subscribe, isDark, () => null);

  return (
    <button
      type="button"
      className={cn("group relative flex size-10 items-center justify-center rounded-xl transition-colors hover:bg-white/10", className)}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      onClick={() => {
        const next = !isDark();
        document.documentElement.classList.toggle("dark", next);
        try {
          localStorage.setItem(KEY, next ? "dark" : "light");
        } catch {
          // Preference just won't persist.
        }
      }}
    >
      <Sun className={cn("absolute size-5 transition-all duration-500", dark === false ? "scale-100 rotate-0 opacity-100" : "scale-50 rotate-90 opacity-0")} aria-hidden />
      <Moon className={cn("absolute size-5 transition-all duration-500", dark ? "scale-100 rotate-0 opacity-100" : "scale-50 -rotate-90 opacity-0")} aria-hidden />
    </button>
  );
}
