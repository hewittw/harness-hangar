import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeScript } from "@/components/theme";
import { authAppearance } from "@/components/clerk-appearance";
import "./globals.css";

// v3 design system fonts: expanded display (SpaceX), crisp text (Stripe-like), technical mono.
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"] });
const instrument = Instrument_Sans({ variable: "--font-instrument", subsets: ["latin"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "Hangar: your Claude harnesses, ready to launch",
  description:
    "Save the Claude Code harness you already have, compose new ones from its parts, and install it into any new folder.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${instrument.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="ds">
        <ClerkProvider
          appearance={{
            // Clerk follows the site's design tokens, so sign-in matches light and dark mode.
            variables: {
              colorPrimary: "var(--accent)",
              colorBackground: "var(--raised)",
              colorForeground: "var(--ink)",
              colorMutedForeground: "var(--ink-2)",
              colorInput: "var(--sunken)",
              colorInputForeground: "var(--ink)",
              colorBorder: "var(--hairline-2)",
              colorNeutral: "var(--ink)",
              fontFamily: "var(--font-instrument)",
              borderRadius: "12px",
            },
            // Explicit element styles: Clerk can't derive button fills from CSS variables.
            // Applied here so the header's sign-in/up modals match the dedicated pages.
            elements: authAppearance.elements,
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
