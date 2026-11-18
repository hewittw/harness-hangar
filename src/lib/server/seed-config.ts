/** The harnesses every new account starts with: one per kind of user, so anyone can try an install right away. */
export const BASICS: readonly (readonly [packId: string, harnessName: string])[] = [
  ["builder", "Product engineer"],
  ["design", "Landing page studio"],
  ["family", "Family calendar & school"],
  ["student", "Research papers"],
];
