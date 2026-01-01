"use client";

import { usePostHog } from "posthog-js/react";

type ContactProps = {
  headline?: string;
  blurb?: string;
  email?: string;
};

export default function Contact({
  headline = "",
  blurb = `For collaborations, commissions, or project inquiries,
you can reach me at hello@egecam.dev.

I'm open to work across film, games, and other narrative-driven projects.`,
  email = "hello@egecam.dev",
}: ContactProps) {
  const posthog = usePostHog();
  return (
    <div className="rounded-3xl border border-black/10 bg-[var(--background-alt)] px-6 py-7 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
      <div className="space-y-3">
        <p className="eyebrow text-xs text-[var(--accent)]">{headline}</p>
        <h3 className="title-strong text-3xl">Let’s connect</h3>
        <p className="subtitle whitespace-pre-line text-base text-[var(--foreground)]/80">
          {blurb}
        </p>
      </div>
      <div className="mt-5 flex flex-col gap-3">
        <a
          href={`mailto:${email}`}
          onClick={() => posthog.capture("email_button_clicked", { email })}
          className="inline-flex items-center gap-2 self-start rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--background)] transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]/60"
        >
          Email me
          <span className="text-[var(--background)]/80">{email}</span>
        </a>
      </div>
    </div>
  );
}
