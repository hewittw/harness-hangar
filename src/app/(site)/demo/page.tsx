import Link from "next/link";
import type { ReactNode } from "react";
import { ProsePage, Stage } from "@/components/prose/prose";
import { CopyButton } from "@/components/copy-button";

export const metadata = { title: "Demo guide · Hangar" };

export default function DemoPage() {
  return (
    <ProsePage
      kicker="For graders and testers"
      title={
        <>
          Demo it in <span className="ds-brand-text">ten minutes.</span>
        </>
      }
      lede="A step-by-step walkthrough of the core task: take a ready-made harness and launch it in a brand-new folder, then build a new harness from parts of others. Each step says what you should see."
    >
      <ol className="flex flex-col gap-6">
      <Stage n={0} title="Before you start" time="1 min">
        <p>
          You need <b>Claude Code</b> installed and a terminal. Everything else happens on this site. The whole run takes about
          ten minutes. Nothing you do here touches your existing projects as long as you install into a new, empty folder.
        </p>
        <Links />
      </Stage>

      <Stage n={1} title="Sign up" time="1 min">
        <p>
          Click <b>Get started</b> in the top bar and sign up with email or Google. You land on the <b>Welcome</b> page, which
          says your library already has four basic harnesses.
        </p>
        <p>
          Optional: load a <b>starter pack</b> (for example Parent &amp; home) to add more. The card confirms how many harnesses
          were added.
        </p>
        <Expect>Welcome page, then four harnesses in your Library.</Expect>
      </Stage>

      <Stage n={2} title="Look inside a harness" time="1 min">
        <p>
          Open <b>Library</b> and click <b>Product engineer</b>. You see its rules grouped by section, its permissions (deny rules
          in red), its skills, MCP servers and hook. Expand a skill to read its files. The card at the top shows the exact command
          to install it.
        </p>
        <p>
          Optional: rename it or edit its description at the bottom. Try putting an email address in the description: the leak
          scan rejects it without repeating it back.
        </p>
        <Expect>Parts grouped by kind; the install command with a Copy button.</Expect>
      </Stage>

      <Stage n={3} title="Compose a new harness" time="2 min">
        <p>
          Open <b>Make</b>. Pick a few rules from <b>Product engineer</b> and a skill from <b>Landing page studio</b>. Switch the
          toggle to <b>By part type</b> to see the same choices grouped as Rules, Permissions, Skills and MCP servers.
        </p>
        <p>
          Watch the panel on the right: it counts the parts and notes the <b>deny rules added automatically</b> from every source
          you used. Give the harness a name and click <b>Save harness</b>.
        </p>
        <Expect>The new harness opens, marked Composed, with every deny rule from its sources.</Expect>
      </Stage>

      <Stage n={4} title="Connect Claude Code" time="1 min">
        <p>
          Open <b>Connect</b> and click <b>Make token and show command</b>. Copy the command and run it in your terminal. It
          adds Hangar to Claude Code for every folder on your computer.
        </p>
        <Cmd text={'claude mcp add --transport http --scope user hangar https://harness-hangar.vercel.app/api/mcp --header "Authorization: Bearer hk_…"'} />
        <Expect>
          <code>✔ Added HTTP MCP server hangar</code>. The token is shown only once; Hangar stores just a hash of it.
        </Expect>
      </Stage>

      <Stage n={5} title="Launch a harness in an empty folder" time="3 min">
        <p>Make a new folder and start Claude Code in it:</p>
        <Cmd text="mkdir -p ~/hangar-demo && cd ~/hangar-demo && claude" />
        <p>
          Type <code>/mcp</code> and check that <b>hangar</b> is connected. Then run the install command and press Enter. You
          don&apos;t need to type a name: Claude lists your harnesses and asks which one.
        </p>
        <Cmd text="/mcp__hangar__install-harness" />
        <p>
          Pick <b>Product engineer</b> (or the one you composed). Claude asks what the folder is for, shows the hooks, allow
          rules and MCP servers it is about to write, and waits for your OK.
        </p>
        <Expect>Claude writes the files and tells you which environment variables to set, then to restart.</Expect>
      </Stage>

      <Stage n={6} title="Check that it worked" time="1 min">
        <p>Leave Claude Code and look at what was written:</p>
        <Cmd text="ls -a && cat AGENTS.md" />
        <p>
          You should see <code>AGENTS.md</code> and <code>CLAUDE.md</code> with the harness&apos;s rules,{" "}
          <code>.claude/skills/</code>, <code>.claude/settings.json</code> with its permissions and hook, and{" "}
          <code>.mcp.json</code>. Start <code>claude</code> again and ask it how it should work in this project: it answers from
          those rules.
        </p>
      </Stage>

      <Stage n={7} title="Optional: save your own" time="3 min">
        <p>
          In a project whose Claude setup you like, run <code>/mcp__hangar__save-harness</code>. Claude collects the setup,
          distills it into portable rules, and shows exactly what will be uploaded before saving. Refresh your Library to see it.
        </p>
        <p>
          To see the leak scan, ask Claude to include a fake key such as <code>sk-ant-test1234567890abcdef</code> in a rule. The
          upload is rejected and nothing is saved.
        </p>
      </Stage>

      <Stage n={8} title="Clean up" time="1 min" last>
        <p>
          Revoke your token on <b>Connect</b>, then remove Hangar from Claude Code and delete the demo folder:
        </p>
        <Cmd text="claude mcp remove hangar -s user && rm -rf ~/hangar-demo" />
        <p className="pt-2">
          Curious how it works or what&apos;s next?{" "}
          <Link href="/about" className="font-semibold text-accent underline-offset-4 hover:underline">
            Read About
          </Link>
          .
        </p>
      </Stage>
      </ol>
    </ProsePage>
  );
}

function Cmd({ text }: { text: string }) {
  return (
    <div className="ds-terminal !shadow-none">
      <div className="ds-terminal-bar !h-9">
        <i style={{ background: "#ff5f57" }} />
        <i style={{ background: "#febc2e" }} />
        <i style={{ background: "#28c840" }} />
        <span className="ml-auto">
          <CopyButton text={text} />
        </span>
      </div>
      <pre className="!break-normal !whitespace-pre-wrap !py-3.5 [overflow-wrap:anywhere]">
        <span className="text-white/40">$ </span>
        {text}
      </pre>
    </div>
  );
}

function Expect({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-3 rounded-ds-md border border-[var(--accent-line)] bg-accent-soft px-4 py-3 text-[15px] leading-snug">
      <span className="ds-label mt-[3px] shrink-0 !text-accent">You should see</span>
      <span className="text-ink">{children}</span>
    </p>
  );
}

function Links() {
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      <a href="https://harness-hangar.vercel.app" className="ds-chip hover:border-hairline-2">
        harness-hangar.vercel.app
      </a>
      <a href="https://github.com/hewittw/harness-hangar" className="ds-chip hover:border-hairline-2">
        github.com/hewittw/harness-hangar
      </a>
    </div>
  );
}
