import Track from "./components/Track";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-16 text-zinc-50">
      <main className="w-full max-w-3xl space-y-12">
        <div className="space-y-3">
          <p className="eyebrow text-sm">Music Projects</p>
          <h1 className="title-strong text-4xl sm:text-5xl">
            Ege Cam — Sounds in the Making
          </h1>
          <p className="text-lg leading-8 text-zinc-300">
            This one-page site will showcase my music projects, releases, and
            collaborations. Placeholder copy for now—full details, tracks, and
            visuals coming soon.
          </p>
        </div>

        <section className="space-y-4">
          <Track
            src="https://media.egecam.dev/audio/monuments.wav"
            title="Monuments"
            subtitle="A piece of art that is very good and very bad"
          />
        </section>

        <section className="space-y-5">
          <div className="space-y-2">
            <p className="eyebrow text-sm">What inspires me</p>
            <h2 className="title-strong text-3xl">Sources of spark</h2>
            <p className="text-base leading-7 text-zinc-300">
              Stories, textures, and moments that keep me creating. A quick peek
              at the moods and references shaping these sounds.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              "Late-night city lights",
              "Analog textures",
              "Cinema & soundscapes",
              "Conversations",
            ].map((item) => (
              <div
                key={item}
                className="flex min-h-[160px] items-end justify-start rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] ring-1 ring-zinc-800/60"
              >
                <span className="title-strong text-lg">{item}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
