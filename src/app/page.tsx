"use client";

import { useState } from "react";
import Track from "./components/Track";
import Sparks from "./components/Sparks";
import Contact from "./components/Contact";

export default function Home() {
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [selectedSparkId, setSelectedSparkId] = useState<string | null>(null);

  const tracks = [
    {
      sparkId: "late-night-drive",
      trackId: "the-quiet-brave-lily",
      src: "https://media.egecam.dev/audio/the_quiet_brave_lily.wav",
      title: "The Quiet Brave Lily",
      subtitle: "Nostalgic, fragile yet hopeful",
    },
    {
      sparkId: "analog-textures",
      trackId: "flip-flops",
      src: "https://media.egecam.dev/audio/flip-flop.wav",
      title: "Flip-flops",
      subtitle: "Lively seaside longing",
    },
    {
      sparkId: "cinema-grain",
      trackId: "spellsire",
      src: "https://media.egecam.dev/audio/spellsire.wav",
      title: "Spellsire",
      subtitle: "Mythic digital folk",
    },
    {
      sparkId: "coastal-air",
      trackId: "monuments",
      src: "https://media.egecam.dev/audio/monuments.wav",
      title: "Monuments",
      subtitle: "Mythic voice of ancient stones",
    },
  ];

  const selectedTrack = tracks.find((track) => track.sparkId === selectedSparkId);

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
            I work by listening to the story first. Whether it comes from an
            image, a scene, or a mood, I translate narrative into sound through
            restrained melodies, textural harmony, and subtle movement. My
            approach draws from a wide palette of instruments and sound sources,
            moving freely between acoustic, orchestral, and electronic elements
            to find the right voice for each world.
          </p>
          <div className="pt-2">
            <iframe
              data-testid="embed-iframe"
              style={{ borderRadius: "12px" }}
              src="https://open.spotify.com/embed/track/21mEgD8s9cfbeyLyGtUFN4?utm_source=generator&theme=0"
              width="100%"
              height="152"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            ></iframe>
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
          {selectedTrack && (
            <div
              key={selectedTrack.trackId}
              className="rounded-3xl border border-black/15 bg-[#1f1f1f] px-6 py-6"
            >
              <Track
                trackId={selectedTrack.trackId}
                isActive={activeTrackId === selectedTrack.trackId}
                onRequestPlay={setActiveTrackId}
                src={selectedTrack.src}
                title={selectedTrack.title}
                subtitle={selectedTrack.subtitle}
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
