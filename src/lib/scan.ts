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

// Every quantifier is bounded or anchored to a literal prefix so a large upload can't make the scan slow.
const SECRET_PATTERNS: Pattern[] = [
  { issue: "private key block", re: /-----BEGIN [A-Z ]{0,40}PRIVATE KEY(?: BLOCK)?-----/, fix: "Remove the key entirely." },
  { issue: "Anthropic API key", re: /\bsk-ant-[A-Za-z0-9_-]{10,}/, fix: PLACEHOLDER_FIX },
  { issue: "OpenAI-style API key", re: /\bsk-(?!ant-)(?:proj-)?[A-Za-z0-9_-]{20,}/, fix: PLACEHOLDER_FIX },
  { issue: "GitHub token", re: /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})/, fix: PLACEHOLDER_FIX },
  { issue: "GitLab token", re: /\bglpat-[A-Za-z0-9_-]{20,}/, fix: PLACEHOLDER_FIX },
  { issue: "AWS access key", re: /\bAKIA[0-9A-Z]{16}\b/, fix: PLACEHOLDER_FIX },
  { issue: "Slack token", re: /\bxox[abprs]-[A-Za-z0-9-]{10,}/, fix: PLACEHOLDER_FIX },
  { issue: "webhook URL", re: /hooks\.slack\.com\/services\/[A-Za-z0-9/]{10,}|discord(?:app)?\.com\/api\/webhooks\/\d{5,}\/[A-Za-z0-9_-]{10,}/, fix: "Replace the webhook URL with ${WEBHOOK_URL}." },
  { issue: "Stripe/Clerk-style secret key", re: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{10,}/, fix: PLACEHOLDER_FIX },
  { issue: "webhook signing secret", re: /\bwhsec_[A-Za-z0-9+/=]{10,}/, fix: PLACEHOLDER_FIX },
  { issue: "Supabase secret key", re: /\bsb_secret_[A-Za-z0-9_-]{10,}/, fix: PLACEHOLDER_FIX },
  { issue: "Google API key", re: /\bAIza[0-9A-Za-z_-]{35}\b/, fix: PLACEHOLDER_FIX },
  { issue: "npm token", re: /\bnpm_[A-Za-z0-9]{30,}/, fix: PLACEHOLDER_FIX },
  { issue: "Hugging Face token", re: /\bhf_[A-Za-z0-9]{30,}/, fix: PLACEHOLDER_FIX },
  { issue: "SendGrid key", re: /\bSG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}/, fix: PLACEHOLDER_FIX },
  { issue: "Hangar token", re: /\bhk_[A-Za-z0-9]{20,}/, fix: PLACEHOLDER_FIX },
  { issue: "JSON Web Token", re: /\beyJ[A-Za-z0-9_-]{10,4096}\.[A-Za-z0-9_-]{10,4096}\.[A-Za-z0-9_-]{10,4096}/, fix: PLACEHOLDER_FIX },
  { issue: "literal Bearer token", re: /\bBearer\s{1,10}(?!\$\{)[A-Za-z0-9._~+/-]{20,}/i, fix: "Use `Bearer ${VAR_NAME}` instead of the literal token." },
  {
    issue: "credential in a URL",
    re: /[?&](?:api[_-]?key|access[_-]?token|token|key|secret)=(?!\$\{)[^&\s"'`]{8,}/i,
    fix: "Replace the value in the URL with ${VAR_NAME}.",
  },
  {
    issue: "password in a URL",
    re: /\b[a-z][a-z0-9+.-]{0,30}:\/\/[^\s:/@"'`]{1,256}:(?!\$\{)[^\s@/"'`]{1,256}@/i,
    fix: "Replace the user:password part with ${VAR_NAME} placeholders.",
  },
  {
    issue: "secret assignment",
    re: /\b[A-Za-z0-9_]{0,40}(?:PASSWORD|PASSWD|SECRET|TOKEN|API_?KEY|PRIVATE_?KEY|ACCESS_?KEY)[A-Za-z0-9_]{0,40}\s{0,5}[=:]\s{0,5}["']?(?!\$\{|<|\*{3}|x{3}|your[-_]|\.\.\.|process\.env|os\.environ|env\(|\$[A-Z_])[A-Za-z0-9+/_.=-]{12,}/i,
    fix: "Replace the value with ${VAR_NAME} (or a placeholder like <your-token>).",
  },
];

const PERSONAL_PATTERNS: Pattern[] = [
  {
    issue: "home directory path",
    re: /(?:\/Users\/|\/home\/)(?![<$~{])[^/\s"'`)]{1,100}|\/root\/|\b[A-Z]:\\Users\\(?![<$])[^\\\s"'`]{1,100}/i,
    fix: "Make it relative to the project, or write ~ or $HOME instead of the full path. If the path is project-specific, drop the detail and keep only the idea.",
  },
];

// Lookbehind pins each match to the start of a run, so a long run of letters is scanned once, not once per position.
const EMAIL = /(?<![A-Za-z0-9._%+-])[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,253}\.[A-Za-z]{2,24}/g;
const ALLOWED_EMAIL = /^(?:noreply@|no-reply@)|@(?:example\.(?:com|org|net)|users\.noreply\.github\.com)$/i;

const SECRETISH_KEY = /key|token|secret|password|passwd|auth|credential|cookie/i;
const SECRETISH_FLAG = /^--?(?:api[-_]?key|token|access[-_]?token|secret|password|passwd|auth|key)(?:=(.*))?$/i;
const PLACEHOLDER_G = /\$\{[A-Za-z_][A-Za-z0-9_]{0,100}(?::-[^}]{0,200})?\}/g;
/** A long run that looks like a token once placeholders are removed. */
const TOKENISH = /[A-Za-z0-9+/_=-]{24,}/;
const URL_TOKEN_SEGMENT = /\/(?=[A-Za-z0-9_-]{0,200}\d)(?=[A-Za-z0-9_-]{0,200}[A-Za-z])[A-Za-z0-9_-]{32,}(?:\/|$|\?)/;

const withoutPlaceholders = (v: string) => v.replace(PLACEHOLDER_G, "");
const isPurePlaceholder = (v: string) => v.length > 0 && withoutPlaceholders(v).trim() === "" ;

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

  if (part.kind === "mcp_server") out.push(...scanMcpConfig(who, part.content.config));

  return out;
}

/**
 * MCP configs: any value under a secret-looking key, any value after a secret-looking CLI flag,
 * and any token-like URL path segment must be a pure ${VAR} placeholder.
 */
function scanMcpConfig(who: string, config: Record<string, unknown>): Finding[] {
  const out: Finding[] = [];
  const placeholderFor = (k: string) => `\${${k.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "") || "SECRET"}}`;

  const walk = (value: unknown, path: string[]) => {
    const key = path[path.length - 1] ?? "";
    const parent = path[path.length - 2] ?? "";
    if (typeof value === "string") {
      const rest = withoutPlaceholders(value);
      const underSecretKey = SECRETISH_KEY.test(key) || ((parent === "env" || parent === "headers") && TOKENISH.test(rest));
      if (underSecretKey && !isPurePlaceholder(value) && !/^Bearer \$\{[^}]+\}$/i.test(value)) {
        out.push({ part: who, where: `config.${path.join(".")}`, issue: "literal value where a secret belongs", fix: `Set it to "${placeholderFor(key)}" so each person supplies their own value.` });
      }
      if (/^https?:\/\//i.test(value) && URL_TOKEN_SEGMENT.test(rest)) {
        out.push({ part: who, where: `config.${path.join(".")}`, issue: "token-like segment in a URL", fix: "Replace the token part of the URL with ${VAR_NAME}." });
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((v, i) => {
        // CLI flags: ["--api-key", "abc"] or ["--token=abc"]
        if (typeof v === "string") {
          const flag = SECRETISH_FLAG.exec(v);
          const prev = i > 0 && typeof value[i - 1] === "string" ? SECRETISH_FLAG.exec(value[i - 1] as string) : null;
          const literal = flag?.[1] !== undefined ? flag[1] : prev && prev[1] === undefined ? v : undefined;
          if (literal !== undefined && literal !== "" && !isPurePlaceholder(literal)) {
            out.push({ part: who, where: `config.${[...path, String(i)].join(".")}`, issue: "literal secret passed as a command-line flag", fix: "Pass ${VAR_NAME} instead of the literal value." });
          }
        }
        walk(v, [...path, String(i)]);
      });
      return;
    }
    if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) walk(v, [...path, k]);
    }
  };

  walk(config, []);
  return out;
}

export function scanParts(parts: PartInput[]): Finding[] {
  return parts.flatMap(scanPart);
}

/** The harness name and description are shown in lists and written into AGENTS.md, so they are scanned too. */
export function scanHarnessMeta(meta: { name: string; description?: string | null }): Finding[] {
  const findings = scanPart({ kind: "rule", name: meta.name, content: { text: meta.description || "-" } });
  return findings.map((f) => ({ ...f, part: "the harness", where: f.where === "name" ? "name" : "description" }));
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
