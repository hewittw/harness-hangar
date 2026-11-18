import { z } from "zod";
import { harnessInput } from "./harness";
import { scanHarnessMeta, type Finding } from "./scan";

/**
 * Pure helpers for the delete_harness and update_harness MCP tools: input schemas,
 * validation and the error messages the calling model reads.
 */

export const deleteHarnessInput = z.object({
  name: z.string().describe("Exact harness name, as shown by list_harnesses."),
  confirm: z
    .literal(true)
    .describe("Must be true. Set it only after the user has explicitly said yes to deleting this harness."),
});

export const updateHarnessInput = z.object({
  name: z.string().describe("Current harness name, as shown by list_harnesses."),
  new_name: harnessInput.shape.name.optional().describe("New name for the harness."),
  description: harnessInput.shape.description.describe("New one-line description. Pass an empty string to clear it."),
});
export type UpdateHarnessInput = z.infer<typeof updateHarnessInput>;

export type MetaChanges = { name?: string; description?: string | null };

export const harnessNotFound = (name: string) =>
  `No harness named "${name}" in the user's library. Call list_harnesses to see the exact names. Nothing was changed.`;

export const harnessNameTaken = (name: string) =>
  `The user already has a harness named "${name}". Ask the user for a different name, then call update_harness again. Nothing was changed.`;

/** Leak-scan findings for new metadata, written for the model. Never repeats the secret. */
export function formatMetaFindings(findings: Finding[]): string {
  const n = findings.length;
  return [
    `Update rejected: the leak scan found ${n} issue${n === 1 ? "" : "s"} in the new values. Nothing was changed.`,
    "Choose values without them, then call update_harness again. Do not repeat any secret back to the user.",
    ...findings.map((f) => `- ${f.where}: ${f.issue}. ${f.fix}`),
  ].join("\n");
}

/** Turn update_harness input into the column changes to make, or a model-readable reason not to. */
export function planUpdate(input: UpdateHarnessInput): { ok: true; changes: MetaChanges } | { ok: false; message: string } {
  if (input.new_name === undefined && input.description === undefined) {
    return { ok: false, message: "Nothing to change: pass new_name, description, or both. Nothing was changed." };
  }
  const changes: MetaChanges = {};
  if (input.new_name !== undefined && input.new_name !== input.name) changes.name = input.new_name;
  if (input.description !== undefined) changes.description = input.description === "" ? null : input.description;
  if (!Object.keys(changes).length) {
    return { ok: false, message: `new_name is the same as the current name "${input.name}". Nothing was changed.` };
  }
  // Scan only the new values ("-" stands in for anything not being changed).
  const findings = scanHarnessMeta({ name: changes.name ?? "-", description: changes.description });
  if (findings.length) return { ok: false, message: formatMetaFindings(findings) };
  return { ok: true, changes };
}
