/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#EEEFE9",
        "paper-raised": "#F7F7F2",
        ink: "#1C2B2A",
        "ink-soft": "#4B5B59",
        rule: "#C9CFC5",
        sidebar: "#17241F",
        "sidebar-active": "#2A3F37",
        "sidebar-text": "#B9C7BD",
        "sidebar-muted": "#8FA095",
        receita: "#3E6B52",
        "receita-soft": "#DCE8DF",
        despesa: "#A2432E",
        "despesa-soft": "#F0DDD5",
        accent: "#2E4A5C",
        "accent-soft": "#DCE5E9",

        /* ---- Tokens de modo escuro (base para o app inteiro) ---- */
        "paper-dark": "#141B17",
        "paper-raised-dark": "#1B2420",
        "ink-dark": "#E7E9E1",
        "ink-soft-dark": "#93A399",
        "rule-dark": "#2B3630",
        "receita-dark": "#6FA184",
        "receita-soft-dark": "#1E2E25",
        "despesa-dark": "#D98A6E",
        "despesa-soft-dark": "#33221C",
        "accent-dark": "#82A8BC",
        "accent-soft-dark": "#1D2A30",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans: ["IBM Plex Sans", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(23,36,31,0.06), 0 8px 24px rgba(23,36,31,0.05)",
        "card-dark": "0 1px 2px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.25)",
      },
    },
  },
  plugins: [],
}