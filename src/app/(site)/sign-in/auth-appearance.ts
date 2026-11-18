/**
 * Element overrides for the Clerk sign-in and sign-up cards. The root layout themes Clerk with design tokens,
 * but Clerk can't derive its button fill or border shades from CSS variables (the primary button came out
 * transparent and the borders nearly invisible), so these set them directly from the same tokens.
 */
export const authAppearance = {
  elements: {
    cardBox: {
      boxShadow: "0 0 0 1px var(--hairline-2), var(--shadow-pop)",
      borderRadius: "var(--r-lg)",
    },
    headerTitle: { fontFamily: "var(--font-display)", fontWeight: 650, fontSize: "20px", letterSpacing: "-0.012em" },
    socialButtonsBlockButton: {
      color: "var(--ink)",
      backgroundColor: "var(--raised)",
      // Clerk draws these outlines with box-shadow in a more specific rule, so the override needs !important.
      boxShadow: "0 0 0 1px var(--hairline-2) !important",
      "&:hover": { backgroundColor: "var(--sunken)" },
    },
    socialButtonsBlockButtonText: { color: "var(--ink)", fontWeight: 600 },
    dividerLine: { backgroundColor: "var(--hairline-2)" },
    dividerText: { color: "var(--ink-3)" },
    formFieldLabel: { color: "var(--ink-2)", fontWeight: 600 },
    formFieldInput: {
      height: "44px",
      backgroundColor: "var(--sunken)",
      boxShadow: "0 0 0 1px var(--hairline-2) !important",
      "&:focus": { backgroundColor: "var(--raised)", boxShadow: "0 0 0 1px var(--accent), 0 0 0 4px var(--accent-soft) !important" },
    },
    formButtonPrimary: {
      height: "44px",
      border: 0,
      borderRadius: "999px",
      color: "#fff",
      fontSize: "15px",
      fontWeight: 600,
      textShadow: "0 1px 1px rgb(0 0 0 / 0.15)",
      backgroundImage: "var(--brand)",
      backgroundSize: "160% 100%",
      backgroundPosition: "0% 50%",
      backgroundOrigin: "border-box",
      boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.35), 0 12px 32px -10px color-mix(in oklab, var(--g3) 70%, transparent)",
      transition: "background-position 200ms, box-shadow 200ms",
      "&:hover": { backgroundPosition: "100% 50%" },
      "&::after": { display: "none" },
    },
    footerActionText: { color: "var(--ink-2)" },
    footerActionLink: { color: "var(--accent)", fontWeight: 600 },
    formFieldAction: { color: "var(--accent)" },
    identityPreviewEditButton: { color: "var(--accent)" },
  },
};
