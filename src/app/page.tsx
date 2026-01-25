"use client";

import { useEffect, useRef, useState } from "react";
import { usePostHog } from "posthog-js/react";
import CassettePlayer from "./components/CassettePlayer";
import Contact from "./components/Contact";

export default function Home() {
  const posthog = usePostHog();
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [spotifyLoaded, setSpotifyLoaded] = useState(false);
  const pageLoadTimeRef = useRef<number>(0);

  // Initialize page load time on mount
  useEffect(() => {
    pageLoadTimeRef.current = Date.now();
  }, []);

  // Track page visit duration
  useEffect(() => {
    const trackPageDuration = () => {
      const durationSeconds = Math.round(
        (Date.now() - pageLoadTimeRef.current) / 1000
      );
      posthog.capture("page_visit_duration", { durationSeconds });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        trackPageDuration();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      trackPageDuration();
    };
  }, [posthog]);

  return (
    <div className="flex min-h-screen items-start justify-center bg-[var(--background)] px-4 py-10 text-[var(--foreground)] sm:px-6 sm:py-12 md:py-14">
      <main className="w-full max-w-3xl space-y-8 sm:space-y-10">
        {/* Hero */}
        <header className="space-y-4">
          <h1 className="title-strong text-5xl sm:text-6xl">Ege Çam</h1>
          <p className="subtitle text-base sm:text-lg">
            I create sonic experiences that live between story and image.
          </p>
          <p className="subtitle">
            I work by listening to the story first. Whether it comes from an
            image, a scene, or a mood, I translate narrative into sound through
            restrained melodies, textural harmony, and subtle movement. My
            approach draws from a wide palette of instruments and sound sources,
            moving freely between acoustic, orchestral, and electronic elements
            to find the right voice for each world.
          </p>
          <div className="pt-2">
            <div className="relative h-[152px]">
              {!spotifyLoaded && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[var(--background-alt)]">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
                </div>
              )}
              <iframe
                data-testid="embed-iframe"
                className={`relative z-10 h-full w-full rounded-2xl transition-opacity duration-300 ${
                  spotifyLoaded ? "opacity-100" : "opacity-0"
                }`}
                src="https://open.spotify.com/embed/track/21mEgD8s9cfbeyLyGtUFN4?utm_source=generator&theme=0"
                width="100%"
                height="152"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                onLoad={() => setSpotifyLoaded(true)}
              />
            </div>
          </div>
        </header>

        {/* Sparks */}
        <section className="space-y-4 pt-6 sm:pt-8">
          <div className="flex items-start justify-between gap-6">
            <h2 className="title-strong text-3xl">Sparks</h2>
            <p className="subtitle text-sm max-w-[200px] text-right hidden sm:block">
              My work is sparked by memory, story, and imagination.
            </p>
          </div>
          <CassettePlayer
            activeTrackId={activeTrackId}
            onRequestPlay={setActiveTrackId}
          />
        </section>

        {/* Contact */}
        <section className="space-y-4">
          <Contact />
        </section>

        {/* Footnote */}
        <footer className="pt-8 pb-4 text-center">
          <p className="text-xs text-[var(--foreground)]/30 tracking-wide">
            pressed with care, one track at a time
          </p>
        </footer>
      </main>
    </div>
  );
}
