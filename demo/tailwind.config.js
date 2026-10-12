/** @type {import('tailwindcss').Config} */
// DESIGN.md core rule: no raw hex/px in components — every color resolves to a
// semantic CSS custom property declared in src/tokens.css (§1 token table).
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--bg-canvas)",
        card: "var(--bg-card)",
        interactive: "var(--bg-interactive)",
        elevated: "var(--bg-elevated)",
        brandblack: "var(--bg-brand-black)",
        functional: "var(--accent-functional)",
        accentbrand: "var(--accent-brand)",
        accenthover: "var(--accent-hover)",
        accenton: "var(--accent-on)",
        primary: "var(--fg-primary)",
        secondary: "var(--fg-secondary)",
        tertiary: "var(--fg-tertiary)",
        muted: "var(--fg-muted)",
        disabled: "var(--fg-disabled)",
        hairline: "var(--border-hairline)",
        variant: "var(--surface-variant)",
        lightpill: "var(--light-pill)",
        lightpillfg: "var(--light-pill-fg)",
      },
      fontFamily: {
        ui: "var(--font-ui)",
        mono: "var(--font-mono)",
      },
      borderRadius: {
        pill: "var(--radius-pill)",
        circle: "var(--radius-circle)",
        card: "var(--radius-card)",
        panel: "var(--radius-panel)",
        sm: "var(--radius-sm)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        panel: "var(--shadow-panel)",
        float: "var(--shadow-float)",
        greenglow: "var(--shadow-green-glow)",
      },
      maxWidth: {
        container: "var(--container-max)",
      },
      zIndex: {
        bg: "var(--z-bg)",
        base: "var(--z-base)",
        sticky: "var(--z-sticky)",
        overlay: "var(--z-overlay)",
        modal: "var(--z-modal)",
      },
    },
  },
  plugins: [],
};
