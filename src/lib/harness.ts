import { z } from "zod";

/** The six kinds of harness part (Week 6's definition of a harness). */
export const PART_KINDS = ["rule", "skill", "agent", "mcp_server", "permission", "hook"] as const;
export type PartKind = (typeof PART_KINDS)[number];

export const LIMITS = {
  maxParts: 300,
  maxFileBytes: 200_000,
  maxFilesPerPart: 50,
  maxTotalBytes: 1_500_000,
} as const;

/** Names become folder/file names on install, so keep them boring. */
const safeName = z
  .string()
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/, "use letters, digits, dot, dash, underscore (max 64 chars)");

/** Relative path inside a part's folder. No absolute paths, no "..", no backslashes. */
const relPath = z
  .string()
  .min(1)
  .max(200)
  .refine((p) => !p.startsWith("/") && !p.includes("\\") && !p.split("/").includes(".."), {
    message: "must be a relative path inside the part's folder (no leading /, no .., no backslashes)",
  });

const file = z.object({ path: relPath, content: z.string().max(LIMITS.maxFileBytes) });
const files = z.array(file).max(LIMITS.maxFilesPerPart);

export const ruleContent = z.object({
  text: z.string().min(1).max(2000),
  section: z.string().max(80).optional(),
});
export const skillContent = z.object({ files: files.min(1) }).refine(
  (c) => c.files.some((f) => f.path === "SKILL.md"),
  { message: "a skill needs a SKILL.md file" },
);
export const agentContent = z.object({ content: z.string().min(1).max(LIMITS.maxFileBytes) });
export const mcpServerContent = z.object({ config: z.record(z.string(), z.unknown()) });
export const permissionContent = z.object({
  effect: z.enum(["allow", "deny", "ask"]),
  rule: z.string().min(1).max(300),
});
export const hookContent = z.object({
  event: z.string().min(1).max(60),
  matcher: z.string().max(200).optional(),
  hooks: z
    .array(z.object({ type: z.literal("command"), command: z.string().min(1).max(2000), timeout: z.number().optional() }))
    .min(1),
  /** Scripts the hook runs, installed under .claude/hooks/. */
  files: files.optional(),
});

export const partInput = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("rule"), name: z.string().min(1).max(200), content: ruleContent }),
  z.object({ kind: z.literal("skill"), name: safeName, content: skillContent }),
  z.object({ kind: z.literal("agent"), name: safeName, content: agentContent }),
  z.object({ kind: z.literal("mcp_server"), name: safeName, content: mcpServerContent }),
  z.object({ kind: z.literal("permission"), name: z.string().min(1).max(200), content: permissionContent }),
  z.object({ kind: z.literal("hook"), name: safeName, content: hookContent }),
]);
export type PartInput = z.infer<typeof partInput>;

export const harnessInput = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  parts: z.array(partInput).min(1).max(LIMITS.maxParts),
});
export type HarnessInput = z.infer<typeof harnessInput>;

/** A part as stored (has an id and belongs to a harness). */
export type StoredPart = PartInput & { id: string; harness_id: string; position?: number };
