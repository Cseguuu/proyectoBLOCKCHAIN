/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0f1419",
        panel: "#1a2129",
        border: "#2d3742",
        text: "#e6e8ea",
        muted: "#8b97a3",
        accent: "#4f9cf9",
        ok: "#3fb96a",
        bad: "#e05858",
        warn: "#e0a93f",
      },
      fontFamily: {
        mono: ["Consolas", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};
