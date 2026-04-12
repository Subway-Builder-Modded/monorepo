export const THEME_HYDRATION_SCRIPT =
  '(function(){try{var d=document.documentElement;var stored=localStorage.getItem("theme");var theme=stored&&stored!=="system"?stored:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");d.classList.remove("light","dark");d.classList.add(theme);d.style.colorScheme=theme;}catch(_){}})();';
