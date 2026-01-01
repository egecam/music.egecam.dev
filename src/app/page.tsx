"use client";

import { useEffect, useRef, useState } from "react";
import { usePostHog } from "posthog-js/react";
import Track from "./components/Track";
import Sparks from "./components/Sparks";
import Contact from "./components/Contact";

type TrackData = {
  sparkId: string;
  trackId: string;
  src: string;
  title: string;
  subtitle: string;
  highlightStart: number;
  highlightEnd: number;
};

export default function Home() {
  const posthog = usePostHog();
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [selectedSparkId, setSelectedSparkId] = useState<string | null>(null);
  const [spotifyLoaded, setSpotifyLoaded] = useState(false);
  const [displayedTrack, setDisplayedTrack] = useState<TrackData | null>(null);
  const [trackAnimState, setTrackAnimState] = useState<"in" | "out">("in");
  const pageLoadTimeRef = useRef<number>(Date.now());

  const tracks: TrackData[] = [
    {
      sparkId: "late-night-drive",
      trackId: "the-quiet-brave-lily",
      src: "https://media.egecam.dev/audio/the_quiet_brave_lily.wav",
      title: "The Quiet Brave Lily",
      subtitle: "Nostalgic, fragile yet hopeful",
      highlightStart: 81, // 1:21
      highlightEnd: 95, // 1:35
    },
    {
      sparkId: "analog-textures",
      trackId: "flip-flops",
      src: "https://media.egecam.dev/audio/flip-flop.wav",
      title: "Flip-flops",
      subtitle: "Lively seaside longing",
      highlightStart: 116, // 1:56
      highlightEnd: 135, // 2:15
    },
    {
      sparkId: "cinema-grain",
      trackId: "spellsire",
      src: "https://media.egecam.dev/audio/spellsire.wav",
      title: "Spellsire",
      subtitle: "Neo-noir digital folk",
      highlightStart: 138, // 2:18
      highlightEnd: 157, // 2:37
    },
    {
      sparkId: "coastal-air",
      trackId: "monuments",
      src: "https://media.egecam.dev/audio/monuments.wav",
      title: "Monuments",
      subtitle: "Mythic voice of ancient stones",
      highlightStart: 64, // 1:04
      highlightEnd: 80, // 1:20
    },
  ];

  const selectedTrack = tracks.find(
    (track) => track.sparkId === selectedSparkId
  );

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

  useEffect(() => {
    if (!selectedTrack) {
      setDisplayedTrack(null);
      return;
    }

    if (!displayedTrack) {
      setDisplayedTrack(selectedTrack);
      setTrackAnimState("in");
      return;
    }

    if (selectedTrack.trackId === displayedTrack.trackId) return;

    setTrackAnimState("out");
    const timeout = setTimeout(() => {
      setDisplayedTrack(selectedTrack);
      setTrackAnimState("in");
    }, 260);

    return () => clearTimeout(timeout);
  }, [selectedTrack, displayedTrack]);

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

        {/* Sparks (blank) */}
        <section className="space-y-2 pt-6 sm:pt-8">
          <h2 className="title-strong text-3xl">Sparks</h2>
          <div className="grid grid-cols-1 items-start gap-6 sm:gap-7 md:grid-cols-3">
            <div className="md:col-span-2">
              <Sparks
                activeId={selectedSparkId}
                onSelect={(id) => {
                  setActiveTrackId(null);
                  setSelectedSparkId(id);
                }}
              />
            </div>
            <div className="md:col-span-1 space-y-2 text-left pt-10 sm:pt-12 md:pt-16">
              <p className="subtitle text-base">
                My work is sparked by the intersection of memory, story, and
                imagination. I draw from cultural roots, ancient narratives, and
                everyday emotional residues, then extend them into worlds that
                do not fully exist yet.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          {displayedTrack && (
            <div
              key={displayedTrack.trackId}
              className={`rounded-3xl border border-black/15 bg-[#1f1f1f] px-6 py-6 overflow-hidden [transform-origin:bottom] ${
                trackAnimState === "in"
                  ? "animate-genie-in"
                  : "animate-genie-out"
              }`}
            >
              <Track
                trackId={displayedTrack.trackId}
                isActive={activeTrackId === displayedTrack.trackId}
                onRequestPlay={setActiveTrackId}
                src={displayedTrack.src}
                title={displayedTrack.title}
                subtitle={displayedTrack.subtitle}
                highlightStart={displayedTrack.highlightStart}
                highlightEnd={displayedTrack.highlightEnd}
              />
            </div>
          )}
        </section>

        {/* Contact */}
        <section className="space-y-4">
          <Contact />
        </section>
      </main>
    </div>
  );
}
