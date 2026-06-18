/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta "documento institucional": papel cálido + tinta + granate UAI.
        bg: "#efe7d6", // papel de fondo
        panel: "#fbf7ee", // hoja (tarjeta)
        inset: "#f3ecdd", // recuadro hundido dentro de una hoja
        border: "#d8cbb2", // línea fina color pergamino
        line: "#c8b894", // línea más marcada / reglones
        text: "#221f1a", // tinta
        muted: "#6d6353", // tinta diluida
        accent: "#7a1f2b", // granate institucional
        "accent-deep": "#5c1620",
        navy: "#22324f", // azul institucional secundario
        gold: "#9c7c3c", // dorado del sello
        ok: "#2f6b46", // verde válido
        bad: "#9a2b2b", // rojo ladrillo
        warn: "#9a6b1e", // ocre
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", '"Times New Roman"', "serif"],
        sans: ['"Inter"', "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ['"JetBrains Mono"', "Consolas", "ui-monospace", "monospace"],
      },
      boxShadow: {
        sheet: "0 1px 0 rgba(0,0,0,0.04), 0 8px 24px -16px rgba(60,40,20,0.45)",
      },
    },
  },
  plugins: [],
};
