/**
 * Text for the MCP prompts. In Claude Code these appear as
 * /mcp__hangar__save-harness and /mcp__hangar__install-harness.
 */

export function saveHarnessPrompt(name?: string): string {
  return `Save this project's Claude Code harness to Hangar${name ? ` as "${name}"` : ""}.

A harness is everything around the model: instructions, memory rules, skills, MCP servers, permissions, hooks and subagents. Hangar stores it so the user can reuse it in new projects. Work through these steps in order.

## 1. Collect (read only, change nothing)
Look in the current project folder for:
- CLAUDE.md, AGENTS.md, and any CLAUDE.local.md or nested CLAUDE.md files
- .claude/skills/*/ (every file in each skill folder)
- .claude/agents/*.md
- .claude/commands/*.md (save each as a skill: SKILL.md with the command's text and a short description)
- .claude/settings.json (permissions.allow / ask / deny, and hooks). Skip settings.local.json.
- .mcp.json
- Hook scripts that settings.json runs, if they are inside the project
- This project's auto-memory: ~/.claude/projects/<this folder's path with / replaced by ->/memory/*.md
Never open .env files or anything matching .env*.

## 2. Distill the instructions and memory into rules
Turn CLAUDE.md, AGENTS.md and memory into short, portable rules. Each rule is one idea.
- KEEP how the user likes to work: style, process, safety habits, review and verification habits, tool preferences, "always/never" rules.
- DROP project-specific detail: file paths, repo and project names, deadlines, ids, URLs of private resources, people's names, emails, and anything that only makes sense in this one folder. If a rule mixes both, keep the idea and drop the detail.
- Group rules with a short section name (for example "Workflow", "Safety", "Writing", "Testing").
- Give each rule a short unique slug as its name (for example "ask-before-deploy").

## 3. Keep everything else as it is
- Skills and subagents: copy their files exactly, using paths relative to the skill folder (SKILL.md, scripts/run.sh). Skip binary files and anything over 200 KB.
- MCP servers: one part per server. Copy the config, but replace every key, token or secret with a placeholder like \${GITHUB_TOKEN}.
- Permissions: one part per rule, with effect allow, ask or deny. Name it after the rule.
- Hooks: one part per hook entry, with event, matcher and hooks. Put any scripts it runs in files, with paths relative to .claude/hooks/.

## 4. Show the user what will leave their machine
Show a compact summary: how many rules (list them), and the names of the skills, subagents, MCP servers, permissions and hooks. Point out anything you dropped or rewrote for privacy. Ask the user to confirm, or to name anything to leave out. ${name ? "" : "Ask what to call this harness (suggest a name based on what the project is for). "}Wait for their answer.

## 5. Save
Call save_harness with name, a one-line description of what kind of work this harness is for, and the parts.
- If Hangar rejects the upload, follow its fix instructions exactly, show the user what you changed, and call save_harness again. Never weaken a fix to get past the scan.
- If the name is taken, ask the user whether to replace it.
When it saves, tell the user the link it returns.`;
}

export function installHarnessPrompt(name?: string): string {
  return `Set up this folder as a new Claude Code project from the user's Hangar harness${name ? ` "${name}"` : ""}.

1. ${name ? `Call get_harness with name "${name}".` : "Call list_harnesses, show the user their harnesses, and ask which one to install. Then call get_harness with that name."}
2. Ask the user in one sentence what this new folder is for. Wait for the answer.
3. Check which of the files from get_harness already exist here. Do not overwrite any existing file without asking. For an existing .mcp.json or .claude/settings.json, offer to merge instead of replace.
4. Before writing anything, show the user the parts that can run code or widen access, and get an explicit yes:
   - every hook command in .claude/settings.json
   - every "allow" permission rule
   - every MCP server's command, args and URL in .mcp.json
   If the user declines any of them, leave those entries out.
5. Write the approved files exactly as returned, at the paths given. Only write paths inside this folder; refuse any path that is absolute or contains "..". Do not otherwise change skills, subagents, settings or MCP configs.
6. Add a short "## This project" section at the top of AGENTS.md, after the title, with what the user said the folder is for.
7. If get_harness lists env vars, tell the user which ones to set and where they are used. Never invent or ask them to paste secret values into chat.
8. Tell the user to restart Claude Code in this folder (or run /mcp) so the new MCP servers, permissions and hooks load. Then summarize what was installed.`;
}
