"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type TrackProps = {
  src?: string;
  title?: string;
  subtitle?: string;
  coverSrc?: string;
};

export default function Track({
  src = "https://media.egecam.dev/audio/monuments.wav",
  title = "Monuments",
  subtitle = "Introductory subtitle",
  coverSrc,
}: TrackProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 - 1

  const bars = useMemo(
    () => [
      52, 68, 44, 72, 60, 48, 70, 40, 64, 56, 76, 58, 46, 66, 50, 74, 62, 54,
      78, 60, 48, 68, 44, 72, 60, 48, 70, 40, 64, 56, 76, 58, 46, 66, 50, 74,
      62, 54, 78, 60, 48, 68, 44, 72, 60, 48, 70, 40,
    ],
    []
  );

  const cancelRaf = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const startRaf = () => {
    cancelRaf();
    const step = () => {
      const audio = audioRef.current;
      if (audio) {
        const { duration, currentTime } = audio;
        if (duration && !Number.isNaN(duration)) {
          setProgress(currentTime / duration);
        }
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
  };

  const playAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        startRaf();
      })
      .catch(() => {
        setIsPlaying(false);
        cancelRaf();
      });
  };

  const pauseAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setIsPlaying(false);
    cancelRaf();
  };

  const handleToggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      playAudio();
    } else {
      pauseAudio();
    }
  };

  const handleBarClick = (index: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration || Number.isNaN(audio.duration)) return;
    const position = (index + 1) / bars.length;
    audio.currentTime = audio.duration * position;
    playAudio();
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => {
      setIsPlaying(true);
      startRaf();
    };
    const onPause = () => {
      setIsPlaying(false);
      cancelRaf();
    };
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      cancelRaf();
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      cancelRaf();
    };
  }, []);

  return (
    <div className="flex w-full flex-col gap-2 text-zinc-50">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-amber-300 via-rose-400 to-indigo-500">
          {coverSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverSrc}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="eyebrow text-xs">{subtitle}</p>
          <h2 className="title-strong text-2xl">{title}</h2>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={handleToggle}
          className="inline-flex h-14 w-14 cursor-pointer items-center justify-center text-amber-300 transition hover:text-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300/70 focus-visible:outline-offset-2"
          aria-pressed={isPlaying}
          aria-label={isPlaying ? "Pause track" : "Play track"}
        >
          {isPlaying ? (
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <rect x="5" y="4" width="5" height="16" rx="1.2" />
              <rect x="14" y="4" width="5" height="16" rx="1.2" />
            </svg>
          ) : (
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M6 4.5v15a1 1 0 0 0 1.52.85l12-7.5a1 1 0 0 0 0-1.7l-12-7.5A1 1 0 0 0 6 4.5Z" />
            </svg>
          )}
        </button>

        <div className="relative flex flex-1 items-center gap-[8px] py-4">
          {bars.map((height, index) => {
            const position = progress * bars.length;
            const fillAmount = Math.min(1, Math.max(0, position - index));
            const filled = index < Math.floor(position);
            const intensity = filled ? 1 : 0.35 + fillAmount * 0.65;
            const scale = 1 + fillAmount * 0.25;

            return (
              <button
                key={index}
                type="button"
                onClick={() => handleBarClick(index)}
                className="group relative h-24 w-[6px] cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                aria-label={`Seek to ${(index / bars.length) * 100}%`}
              >
                <span
                  className="absolute inset-x-0 rounded-full transition group-hover:bg-amber-200"
                  style={{
                    height: `${height}%`,
                    top: "50%",
                    transform: `translateY(-50%) scaleY(${scale})`,
                    backgroundColor: "#fbbf24",
                    opacity: intensity,
                    transition:
                      "background-color 200ms ease, opacity 180ms ease, transform 160ms ease",
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <audio ref={audioRef} preload="metadata">
        <source src={src} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}
