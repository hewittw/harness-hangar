/**
 * Theme setup. The script runs before first paint so there is no flash:
 * saved choice (localStorage) wins, otherwise the system setting.
 */
export const THEME_KEY = "hangar-theme";
export const PALETTE_KEY = "hangar-palette";

const script = `(function(){try{var d=document.documentElement;var t=localStorage.getItem("${THEME_KEY}");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}d.dataset.theme=t;var p=localStorage.getItem("${PALETTE_KEY}");if(p)d.dataset.palette=p}catch(e){}})()`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
