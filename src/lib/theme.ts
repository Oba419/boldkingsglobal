export const THEME_STORAGE_KEY = "bkg_theme";

/**
 * Runs in <head> before first paint: applies the saved theme (or the OS
 * preference when none is saved) so there is no flash of the wrong theme, and
 * marks the page as scripted so scroll-reveal animations may hide content.
 */
export const THEME_INIT_SCRIPT = `(function(){var h=document.documentElement;h.classList.add("js");try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;h.classList.toggle("dark",d);}catch(e){}})();`;
