import Track from "./components/Track";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-16 text-zinc-50">
      <main className="w-full max-w-3xl space-y-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">
          Music Projects
        </p>
        <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
          Ege Cam — Sounds in the Making
        </h1>
        <p className="text-lg leading-8 text-zinc-300">
          This one-page site will showcase my music projects, releases, and
          collaborations. Placeholder copy for now—full details, tracks, and
          visuals coming soon.
        </p>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
            Preview Player
          </h2>
          <Track
            src="https://media.egecam.dev/audio/monuments.wav"
            title="Work in Progress"
            subtitle="Demo"
          />
        </section>
      </main>
    </div>
  );
}
