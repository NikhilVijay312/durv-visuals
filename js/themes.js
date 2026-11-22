/* =========================================================
   THEMES — website ke color presets aur heading fonts.
   Admin panel → Site → Theme se choose hota hai.
   ========================================================= */
window.THEMES = {
  "dark-gold":      { name: "Dark Gold (Cinematic)", bg: "#0b0b0c", bg2: "#121214", card: "#17171a", line: "#26262b", text: "#ece7de", muted: "#9a958c", accent: "#c9a55c" },
  "midnight-blue":  { name: "Midnight Blue",         bg: "#0a0f1a", bg2: "#0f1626", card: "#141c2e", line: "#223050", text: "#e6ecf5", muted: "#8b98ad", accent: "#5b9cff" },
  "wine-rose":      { name: "Wine Rose",             bg: "#120a0d", bg2: "#1a0f14", card: "#21131a", line: "#3a2129", text: "#f3e6ea", muted: "#a68f96", accent: "#e0798f" },
  "forest-emerald": { name: "Forest Emerald",        bg: "#08110e", bg2: "#0d1814", card: "#12201a", line: "#1f3329", text: "#e4efe9", muted: "#8aa196", accent: "#3fc58a" },
  "royal-purple":   { name: "Royal Purple",          bg: "#0e0a16", bg2: "#140f20", card: "#1b1429", line: "#2e2245", text: "#ece6f7", muted: "#9b8fb0", accent: "#a77bff" },
  "sunset-orange":  { name: "Sunset Orange",         bg: "#100b08", bg2: "#18110c", card: "#1f1610", line: "#36261b", text: "#f5ebe3", muted: "#a8968a", accent: "#ff8a3d" },
  "light-classic":  { name: "Light Classic (Cream)", bg: "#f7f4ee", bg2: "#efe9df", card: "#ffffff", line: "#e2dacd", text: "#1d1b18", muted: "#6f685e", accent: "#a8823a" },
  "light-minimal":  { name: "Light Minimal (White)", bg: "#ffffff", bg2: "#f4f4f5", card: "#ffffff", line: "#e4e4e7", text: "#111111", muted: "#6b6b70", accent: "#111111" }
};

window.FONTS = {
  "Playfair Display":   "Playfair+Display:ital,wght@0,500;0,700;1,500",
  "Cormorant Garamond": "Cormorant+Garamond:ital,wght@0,500;0,700;1,500",
  "DM Serif Display":   "DM+Serif+Display:ital@0;1",
  "Montserrat":         "Montserrat:ital,wght@0,500;0,700;1,500",
  "Poppins":            "Poppins:ital,wght@0,500;0,700;1,500",
  "Bebas Neue":         "Bebas+Neue",
  "Cinzel":             "Cinzel:wght@500;700"
};

/* settings = { theme, accent, font } → CSS variables lagata hai */
window.applyTheme = function (settings, root = document.documentElement) {
  const t = Object.assign({}, THEMES["dark-gold"], THEMES[settings.theme] || {});
  const accent = /^#[0-9a-f]{6}$/i.test(settings.accent || "") ? settings.accent : t.accent;
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const lum = h => { const [r, g, b] = rgb(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const vars = {
    "--bg": t.bg, "--bg2": t.bg2, "--card": t.card, "--line": t.line, "--text": t.text, "--muted": t.muted,
    "--gold": accent, "--bg-rgb": rgb(t.bg).join(","), "--on-accent": lum(accent) > 0.35 ? "#111" : "#fff"
  };
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
  if (root === document.documentElement) { const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.content = t.bg; }

  const font = settings.font && FONTS[settings.font] ? settings.font : "Playfair Display";
  if (font !== "Playfair Display") {
    const href = `https://fonts.googleapis.com/css2?family=${FONTS[font]}&display=swap`;
    if (!document.querySelector(`link[href="${href}"]`)) {
      const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; document.head.appendChild(l);
    }
  }
  root.style.setProperty("--head", `"${font}", Georgia, serif`);
};
