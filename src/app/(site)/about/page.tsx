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
      lede="Hangar is a home for Claude Code harnesses: everything around the model that makes Claude work the way you like. This page explains what works in this version, why we spent so much of it on design, and where the next iteration goes."
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

      <ProseSection n="05" title="What comes next">
        <p>
          <b>A public marketplace.</b> Right now every library is private. Next, people can publish harnesses, browse and install
          other people&apos;s, and share a harness with a link. Installs from strangers will need a stronger review step before
          hooks or allow rules are written.
        </p>
        <p>
          <b>Write your own skills in Make.</b> Today a new harness can only reuse parts you already have. Next, the Make page gets
          a skill editor: describe what the skill should do, write or generate its <code>SKILL.md</code> and any helper files, and
          add it to the harness you&apos;re building. New skills go through the same leak scan as everything else.
        </p>
        <p>
          <b>Smoother connecting.</b> Personal tokens work, but signing in with OAuth would remove the copy-and-paste step. User
          testing also showed that the install command&apos;s <code>[name]</code> hint doesn&apos;t say what to type, so the next
          version makes that obvious.
        </p>
        <p>
          <b>An AI guide on the website.</b> An assistant that helps you compose a harness by describing what you want (&ldquo;a
          setup for my lab&apos;s Python projects&rdquo;), and keeps up with new skills and MCP servers worth adding.
        </p>
        <p>
          <b>Beyond Claude Code.</b> Support for Claude Desktop and other agents, and a private &ldquo;exact copy&rdquo; mode for
          people who want to keep project-specific details for themselves.
        </p>
        <p className="pt-2">
          Want to try it?{" "}
          <Link href="/demo" className="font-semibold text-accent underline-offset-4 hover:underline">
            Follow the demo guide
          </Link>
          .
        </p>
      </ProseSection>
    </ProsePage>
  );
}
