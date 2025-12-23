import Track from "./components/Track";
import Sparks from "./components/Sparks";

export default function Home() {
  return (
    <div className="flex min-h-screen items-start justify-center bg-[var(--background)] px-6 py-14 text-[var(--foreground)]">
      <main className="w-full max-w-3xl space-y-10">
        {/* Hero */}
        <header className="space-y-4">
          <h1 className="title-strong text-5xl sm:text-6xl">Ege Çam</h1>
          <p className="subtitle text-base sm:text-lg">
            I create sonic experiences that live between story and image.
          </p>
          <p className="subtitle">
            Placeholder copy about your practice, approach, and background. Swap
            in your story to share how you craft sonic experiences, the mediums
            you work in, and what listeners can expect next.
          </p>
        </header>

        <section className="space-y-6">
          <Track
            src="https://media.egecam.dev/audio/monuments.wav"
            title="Monuments"
            subtitle="A piece of art that is very good and very bad"
          />
          <Track
            src="https://media.egecam.dev/audio/monuments.wav"
            title="Monuments"
            subtitle="A piece of art that is very good and very bad"
          />
        </section>

        {/* Sparks (blank) */}
        <section className="space-y-2">
          <h2 className="title-strong text-3xl">Sparks</h2>
          <div className="grid grid-cols-1 items-start gap-6 sm:gap-7 md:grid-cols-3">
            <div className="md:col-span-2">
              <Sparks />
            </div>
            <div className="md:col-span-1 space-y-2 text-left pt-10 sm:pt-12 md:pt-16">
              <p className="subtitle text-base">
                A rotating stack of references that feed the sound. Hover to
                peek at the current inspirations—each cover pops to the front as
                you explore.
              </p>
            </div>
          </div>
        </section>

        {/* Contact (blank) */}
        <section className="space-y-2">
          <h2 className="title-strong text-3xl">Contact</h2>
        </section>
      </main>
    </div>
  );
}
