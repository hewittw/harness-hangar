import type { HarnessInput } from "../harness";

/** A ready-made library a new account can load in one click. Every harness must pass harnessInput and the leak scan. */
export type StarterPack = {
  /** URL-safe id, e.g. "builder". */
  id: string;
  /** Short persona name shown on the card, e.g. "Builder". */
  name: string;
  /** One line about who it's for. */
  tagline: string;
  /** Two or three sentences shown on the card. */
  blurb: string;
  icon: "builder" | "design" | "family" | "student" | "founder";
  harnesses: HarnessInput[];
};
