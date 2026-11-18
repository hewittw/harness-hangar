import type { PartInput } from "./harness";

/**
 * The leak gate. Deterministic: no model involved. Every upload passes through
 * this before it touches the database. Findings never echo the secret back.
 */

export type Finding = {
  part: string; // e.g. `skill "deploy"`
  where: string; // e.g. `files/SKILL.md line 12`
  issue: string; // e.g. `GitHub token`
  fix: string; // instruction written for the model
};

type Pattern = { issue: string; re: RegExp; fix: string };

const PLACEHOLDER_FIX = "Replace it with an env placeholder like ${VAR_NAME} and never paste the real value.";

const SECRET_PATTERNS: Pattern[] = [
  { issue: "private key block", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, fix: "Remove the key entirely." },
  { issue: "Anthropic API key", re: /\bsk-ant-[A-Za-z0-9_-]{10,}/, fix: PLACEHOLDER_FIX },
  { issue: "OpenAI-style API key", re: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}/, fix: PLACEHOLDER_FIX },
  { issue: "GitHub token", re: /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})/, fix: PLACEHOLDER_FIX },
  { issue: "AWS access key", re: /\bAKIA[0-9A-Z]{16}\b/, fix: PLACEHOLDER_FIX },
  { issue: "Slack token", re: /\bxox[abprs]-[A-Za-z0-9-]{10,}/, fix: PLACEHOLDER_FIX },
  { issue: "Stripe/Clerk-style secret key", re: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{10,}/, fix: PLACEHOLDER_FIX },
  { issue: "Supabase secret key", re: /\bsb_secret_[A-Za-z0-9_-]{10,}/, fix: PLACEHOLDER_FIX },
  { issue: "Google API key", re: /\bAIza[0-9A-Za-z_-]{35}\b/, fix: PLACEHOLDER_FIX },
  { issue: "Hangar token", re: /\bhk_[A-Za-z0-9]{20,}/, fix: PLACEHOLDER_FIX },
  { issue: "JSON Web Token", re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, fix: PLACEHOLDER_FIX },
  { issue: "literal Bearer token", re: /Bearer\s+(?!\$\{)[A-Za-z0-9._~+/-]{20,}/, fix: "Use `Bearer ${VAR_NAME}` instead of the literal token." },
  {
    issue: "credential in a URL",
    re: /[?&](?:api[_-]?key|access[_-]?token|token|key|secret)=(?!\$\{)[^&\s"'`]{8,}/i,
    fix: "Replace the value in the URL with ${VAR_NAME}.",
  },
  { issue: "password in a URL", re: /\b[a-z][a-z0-9+.-]*:\/\/[^\s:/@"'`]+:(?!\$\{)[^\s@/"'`]+@/i, fix: "Replace the user:password part with ${VAR_NAME} placeholders." },
];

const PERSONAL_PATTERNS: Pattern[] = [
  {
    issue: "home directory path",
    re: /(?:\/Users\/|\/home\/)(?![<$~{])[^/\s"'`)]+|\b[A-Z]:\\Users\\(?![<$])[^\\\s"'`]+/i,
    fix: "Make it relative to the project, or write ~ or $HOME instead of the full path. If the path is project-specific, drop the detail and keep only the idea.",
  },
];

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const ALLOWED_EMAIL = /^(?:noreply@|no-reply@)|@(?:example\.(?:com|org|net)|users\.noreply\.github\.com)$/i;

const SECRETISH_KEY = /key|token|secret|password|passwd|auth|credential|cookie/i;
const PLACEHOLDER = /\$\{[A-Za-z_][A-Za-z0-9_]*(?::-[^}]*)?\}/;

function label(part: PartInput): string {
  return `${part.kind} "${part.name}"`;
}

/** Yield every string in a value with a readable location. */
function* strings(value: unknown, where: string): Generator<[string, string]> {
  if (typeof value === "string") {
    yield [where, value];
  } else if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) yield* strings(value[i], `${where}[${i}]`);
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      yield* strings(k, `${where} (key)`);
      yield* strings(v, where ? `${where}.${k}` : k);
    }
  }
}

/** Prefer file paths over array indexes in locations: `files/SKILL.md` instead of `files[0].content`. */
function* partStrings(part: PartInput): Generator<[string, string]> {
  const c = part.content as Record<string, unknown>;
  const fileList = Array.isArray(c.files) ? (c.files as { path: string; content: string }[]) : [];
  for (const f of fileList) {
    yield [`files/${f.path} (path)`, f.path];
    yield [`files/${f.path}`, f.content];
  }
  const rest = { ...c };
  delete rest.files;
  yield* strings(rest, "");
  yield ["name", part.name];
}

function lineOf(text: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index; i++) if (text.charCodeAt(i) === 10) line++;
  return line;
}

function locate(where: string, text: string, index: number): string {
  const base = where || "content";
  return text.includes("\n") ? `${base} line ${lineOf(text, index)}` : base;
}

export function scanPart(part: PartInput): Finding[] {
  const out: Finding[] = [];
  const who = label(part);

  for (const [where, text] of partStrings(part)) {
    for (const p of [...SECRET_PATTERNS, ...PERSONAL_PATTERNS]) {
      const m = p.re.exec(text);
      if (m) out.push({ part: who, where: locate(where, text, m.index), issue: p.issue, fix: p.fix });
    }
    for (const m of text.matchAll(EMAIL)) {
      if (ALLOWED_EMAIL.test(m[0])) continue;
      out.push({
        part: who,
        where: locate(where, text, m.index ?? 0),
        issue: "email address",
        fix: "Remove it, or write a placeholder like <your-email>. If a rule says something like \"never send my email\", keep the rule without the address.",
      });
      break; // one email finding per string is enough
    }
  }

  // MCP servers: env values and headers must be placeholders when they look secret.
  if (part.kind === "mcp_server") {
    const cfg = part.content.config;
    for (const field of ["env", "headers"] as const) {
      const obj = cfg[field];
      if (!obj || typeof obj !== "object") continue;
      for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
        if (typeof v !== "string" || PLACEHOLDER.test(v)) continue;
        if (SECRETISH_KEY.test(k) || v.length >= 24) {
          out.push({
            part: who,
            where: `config.${field}.${k}`,
            issue: "literal value where a secret belongs",
            fix: `Set it to "\${${k.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}}" so each person supplies their own value.`,
          });
        }
      }
    }
  }

  return out;
}

export function scanParts(parts: PartInput[]): Finding[] {
  return parts.flatMap(scanPart);
}

/** An error message written for the model that called the tool. */
export function formatFindings(findings: Finding[]): string {
  const n = findings.length;
  const lines = findings.map((f) => `- ${f.part}, ${f.where}: ${f.issue}. ${f.fix}`);
  return [
    `Upload rejected: the leak scan found ${n} issue${n === 1 ? "" : "s"}. Nothing was saved.`,
    "Fix each one in the parts you send (do not edit the user's files), then call save_harness again with the whole harness.",
    "Do not repeat any secret back to the user.",
    ...lines,
  ].join("\n");
}
