import Link from "next/link";
import { ProsePage, ProseSection } from "@/components/prose/prose";

export const metadata = { title: "About · Hangar" };

export default function AboutPage() {
  return (
    <ProsePage
      kicker="About this version"
      title={
        <>
          What we built, <span className="ds-brand-text">and what&apos;s next.</span>
        </>
      }
      lede="Hangar is a home for Claude Code harnesses: everything around the model that makes Claude work the way you like. This page explains what works in this version, why we spent so much of it on design, and our plan for the next iteration."
      actions={
        <>
          <a href="#v2-plan" className="ds-btn ds-btn-brand ds-btn-lg">
            Jump to the v2 plan ↓
          </a>
          <Link href="/demo" className="ds-btn ds-btn-glass ds-btn-lg">
            Demo guide
          </Link>
        </>
      }
    >
      <ProseSection n="01" title="The problem">
        <p>
          After a few weeks with Claude Code, every project folder quietly fills up with things you learned the hard way:
          instructions in <code>CLAUDE.md</code>, memory notes, custom skills, MCP servers, permission rules and hooks. Together
          they are a <b>harness</b>. Today that harness is stuck in the folder where you built it. Starting a new project means
          starting from zero, or copying files by hand and hoping nothing personal or secret comes along.
        </p>
        <p>
          Hangar makes a harness portable. You keep a library of them, mix parts of several into a new one, and install any of
          them into a fresh folder with one command.
        </p>
      </ProseSection>

      <ProseSection n="02" title="What works in this version">
        <p>
          <b>Installing a harness is the core of this version.</b> Every account starts with four ready-made basics (Product
          engineer, Landing page studio, Family calendar &amp; school and Research papers), and five optional starter packs add
          more for builders, web designers, parents, students and founders. Once Claude Code is connected, running{" "}
          <code>/mcp__hangar__install-harness</code> in an empty folder writes the whole setup: <code>AGENTS.md</code>, skills,
          settings with permissions and hooks, and MCP servers. Claude asks what the folder is for and shows you anything that can
          run code before writing it.
        </p>
        <p>
          <b>Building new harnesses is the second half.</b> On the Make page you pick parts from any harnesses in your library,
          either harness by harness or grouped by part type, and save the result as a new one. Every deny rule from a source comes
          along automatically, so a composed harness is never less safe than what it came from. Conflicts between same-named parts
          are shown so you choose which version to keep.
        </p>
        <p>
          <b>Saving your own works too.</b> In any project, <code>/mcp__hangar__save-harness</code> has Claude collect the setup,
          distill instructions and memory into short portable rules (dropping paths, names and project details), and show you
          exactly what will be uploaded. A leak scan on the server rejects anything that looks like a key, token, email or
          home-folder path, and tells Claude how to fix it.
        </p>
        <p>
          Underneath: sign-in with Clerk, a Supabase database with row-level security so no account can see another&apos;s data,
          personal tokens stored only as hashes, rate limits and a storage cap, and an MCP server that offers the same actions as
          the website (list, get, save, compose, rename and delete).
        </p>
      </ProseSection>

      <ProseSection n="03" title="Why this version focused on design">
        <p>
          The first working version had all of the core pieces but almost no real interface. It worked, but it was hard to
          understand what Hangar was, what a harness contained, or what to do next. The lack of design was hurting the product
          more than any missing feature.
        </p>
        <p>
          So we built a design system first and then rebuilt every page on it: one type family with an expanded display face, a
          single brand gradient, light and dark themes, and components shared by every screen. Each page was then checked in both
          themes at phone and desktop sizes, and against accessibility contrast rules. Clear screens made the core flow (connect,
          install, compose) much easier to follow.
        </p>
      </ProseSection>

      <ProseSection n="04" title="How it was built">
        <p>
          Hangar was built with Claude Code agents working in parallel, with a separate team of verifier agents checking their
          work. Every change went through a pull request, a pre-push check (lint, type check, unit tests and a production build)
          and the same checks again in continuous integration before it could reach <code>main</code>. Browser tests sign in as
          test users and confirm that one account can never read another&apos;s harnesses.
        </p>
      </ProseSection>

      <ProseSection n="05" id="v2-plan" title="Plan for v2">
        <p>
          This plan starts from what we saw when people actually used v1: where they got stuck, what confused them, and what
          they asked for. Each item says what we observed and what we&apos;ll do about it.
        </p>

        <h3 className="ds-h3 !mt-4 text-ink">What we saw in testing: still open</h3>
        <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-accent">
          <li>
            <b>The first install step still asks too much.</b> Testers didn&apos;t know what to type after{" "}
            <code>/mcp__hangar__install-harness</code>. Suggestions help, but a new person shouldn&apos;t have to choose anything
            to see it work.
          </li>
          <li>
            <b>People ran commands in the wrong folder</b>: inside an existing project, or in a folder synced to iCloud. Nothing
            told them they were in the wrong place.
          </li>
          <li>
            <b>Saving can&apos;t be reviewed on the website.</b> Claude now finds more skills and asks about missing ones, but the
            user can&apos;t see or edit the list of parts before it uploads.
          </li>
          <li>
            <b>The setup command shows the full secret token on screen</b>, so testers shared it by accident in screenshots.
            Copying a secret into a terminal is also the most confusing step of setup.
          </li>
        </ul>

        <h3 className="ds-h3 !mt-6 text-ink">Already fixed during v1 testing</h3>
        <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-ok">
          <li>
            The install hint said <code>[name]</code> with no clue what to type. It&apos;s now <code>[harness]</code>, suggests
            your harness names, and Connect gives a ready-to-copy command for the simplest one.
          </li>
          <li>Saving missed skills installed for the whole computer or from plugins. It now searches those places and asks.</li>
          <li>After making a token, the page looked like nothing had happened. It now shows a Connected state.</li>
          <li>Composing from many harnesses was hard to scan. Make now has a &ldquo;by part type&rdquo; view.</li>
        </ul>

        <h3 className="ds-h3 !mt-6 text-ink">Fix first</h3>
        <ol className="flex list-decimal flex-col gap-2 pl-5 marker:font-semibold marker:text-accent">
          <li>
            <b>Sign in to Claude Code with OAuth instead of tokens.</b> One click in the browser, nothing to copy, nothing to leak
            in a screenshot.
          </li>
          <li>
            <b>Safer installs.</b> Check that the folder is empty (and not in iCloud) before writing, show a preview of every file,
            and offer undo.
          </li>
          <li>
            <b>Review saves on the website.</b> After Claude collects a setup, show the found skills, MCP servers and rules as a
            checklist where the user can add or remove items before it is stored.
          </li>
          <li>
            <b>Clearer first run.</b> Starter-pack cards show which packs are already loaded, and the install step names a
            harness by default instead of asking.
          </li>
          <li>
            <b>Full contrast on the gradient buttons</b> so every control meets accessibility guidelines.
          </li>
        </ol>

        <h3 className="ds-h3 !mt-6 text-ink">Add next</h3>
        <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-accent">
          <li>
            <b>Write your own skills in Make.</b> Describe what a skill should do, write or generate its <code>SKILL.md</code> and
            helper files, and add it to the harness you&apos;re building. New skills go through the same leak scan.
          </li>
          <li>
            <b>A public marketplace.</b> Publish harnesses, browse and install other people&apos;s, and share one with a link.
            Installs from strangers get a stronger review step before any hook or allow rule is written.
          </li>
          <li>
            <b>An AI guide on the website</b> that builds a harness from a description (&ldquo;a setup for my lab&apos;s Python
            projects&rdquo;) and surfaces new skills and MCP servers worth adding.
          </li>
          <li>
            <b>Updates for installed harnesses.</b> See what changed since you installed one and pull the new version.
          </li>
        </ul>

        <h3 className="ds-h3 !mt-6 text-ink">Later</h3>
        <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-accent">
          <li>Support for Claude Desktop and other agents, not just Claude Code.</li>
          <li>Shared team libraries, and a private &ldquo;exact copy&rdquo; mode that keeps project-specific details.</li>
        </ul>

        <p className="pt-2">
          Want to try v1 first?{" "}
          <Link href="/demo" className="font-semibold text-accent underline-offset-4 hover:underline">
            Follow the demo guide
          </Link>
          .
        </p>
      </ProseSection>
    </ProsePage>
  );
}
