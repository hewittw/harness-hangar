/**
 * Theme setup. The script runs before first paint so there is no flash:
 * saved choice (localStorage) wins, otherwise the system setting.
 */
export const THEME_KEY = "hangar-theme";
export const ACCENT_KEY = "hangar-accent";

const script = `(function(){try{var d=document.documentElement;var t=localStorage.getItem("${THEME_KEY}");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}d.dataset.theme=t;var a=localStorage.getItem("${ACCENT_KEY}");if(a)d.dataset.accent=a}catch(e){}})()`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
