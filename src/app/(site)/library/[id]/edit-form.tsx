"use client";

import { useActionState, useState, useTransition } from "react";
import { updateHarnessDetails, type HarnessDetailsState } from "@/app/actions";

export function EditForm({ id, name, description }: { id: string; name: string; description: string | null }) {
  const [state, formAction, pending] = useActionState<HarnessDetailsState, FormData>(updateHarnessDetails, {});
  const [, startTransition] = useTransition();
  // "Saved" shows after a successful save until the next edit.
  const [dirty, setDirty] = useState(false);

  return (
    <form
      // Submitting through onSubmit (not the action prop) keeps what was typed when the server rejects it.
      onSubmit={(e) => {
        e.preventDefault();
        setDirty(false);
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      onChange={() => setDirty(true)}
      className="flex flex-col gap-5"
      aria-describedby={state.error ? "edit-error" : undefined}
    >
      <input type="hidden" name="id" value={id} />
      <label className="ds-field">
        <span>Name</span>
        <input name="name" className="ds-input" defaultValue={name} maxLength={80} required autoComplete="off" spellCheck={false} />
      </label>
      <label className="ds-field">
        <span>
          Description <span className="font-normal text-ink-3">(optional, one line)</span>
        </span>
        <textarea
          name="description"
          className="ds-input !h-auto min-h-[96px] resize-y !py-3 !leading-[1.5]"
          defaultValue={description ?? ""}
          maxLength={500}
          rows={3}
          placeholder="What is this harness for?"
        />
      </label>

      {state.error && (
        <div
          id="edit-error"
          role="alert"
          className="rounded-ds-md border px-4 py-3 text-[14.5px] text-danger"
          style={{ borderColor: "color-mix(in oklab, var(--danger) 35%, transparent)", background: "color-mix(in oklab, var(--danger) 9%, transparent)" }}
        >
          <p className="font-semibold">{state.error}</p>
          {state.findings && state.findings.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-2">
              {state.findings.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="ds-btn ds-btn-solid" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </button>
        {state.ok && !dirty && !pending && (
          <span className="ds-chip ds-chip-ok" role="status">
            <span className="ds-dot" /> Saved
          </span>
        )}
        <span className="ds-small ml-auto !text-[13px] !text-ink-3">Leak-scanned before it&apos;s stored.</span>
      </div>
    </form>
  );
}
