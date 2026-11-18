"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { deleteHarness } from "@/app/actions";
import { TrashIcon } from "../ui";

/** Two steps: open the confirm panel, then type the harness name to enable the delete button. */
export function DeleteZone({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");

  if (!open) {
    return (
      <button type="button" className="ds-btn ds-btn-danger self-start" onClick={() => setOpen(true)}>
        <TrashIcon /> Delete this harness
      </button>
    );
  }

  return (
    <form action={deleteHarness} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={id} />
      <label className="ds-field">
        <span>
          Type <code className="ds-mono rounded-[6px] bg-sunken px-1.5 py-0.5 text-ink">{name}</code> to confirm
        </span>
        <input
          className="ds-input focus:!border-danger focus:!shadow-[0_0_0_4px_color-mix(in_oklab,var(--danger)_14%,transparent)]"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoFocus
          autoComplete="off"
          spellCheck={false}
          aria-label={`Type ${name} to confirm`}
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <ConfirmButton enabled={typed === name} />
        <button
          type="button"
          className="ds-btn ds-btn-ghost"
          onClick={() => {
            setOpen(false);
            setTyped("");
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function ConfirmButton({ enabled }: { enabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={!enabled || pending}
      className="ds-btn border-transparent text-white"
      style={{ background: "var(--danger)", boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.25), 0 10px 30px -12px var(--danger)" }}
    >
      <TrashIcon /> {pending ? "Deleting…" : "Delete forever"}
    </button>
  );
}
