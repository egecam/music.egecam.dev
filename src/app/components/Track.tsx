"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePostHog } from "posthog-js/react";

// Track unique plays per session (module-level to persist across remounts)
const playedTracksThisSession = new Set<string>();
const playedHighlightsThisSession = new Set<string>();

type TrackProps = {
  trackId: string;
  src?: string;
  title?: string;
  subtitle?: string;
  coverSrc?: string;
  isActive?: boolean;
  onRequestPlay?: (id: string) => void;
  highlightStart?: number;
  highlightEnd?: number;
};

export default function Track({
  trackId,
  src = "https://media.egecam.dev/audio/monuments.wav",
  title = "Monuments",
  subtitle = "Introductory subtitle",
  coverSrc,
  isActive = false,
  onRequestPlay,
  highlightStart = 60,
  highlightEnd = 75,
}: TrackProps) {
  const posthog = usePostHog();
  const ACCENT = "var(--accent)";
  const BASE_BAR = "#f5f5f5";
  const BASE_BAR_FADED = "#a3a3a3";
  const HIGHLIGHT_COLOR = "#facc15";
  const HIGHLIGHT_COLOR_FADED = "#b8a033";
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const postPulseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playStartTimeRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 - 1
  const [postPlayPulse, setPostPlayPulse] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);

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

  const clearPostPulse = () => {
    if (postPulseTimeoutRef.current) {
      clearTimeout(postPulseTimeoutRef.current);
      postPulseTimeoutRef.current = null;
    }
    setPostPlayPulse(false);
  };

  const startRaf = () => {
    cancelRaf();
    const step = () => {
      const audio = audioRef.current;
      if (!audio) return;

      const { duration, currentTime } = audio;
      if (duration && !Number.isNaN(duration)) {
        setProgress(currentTime / duration);
      }
      rafRef.current = requestAnimationFrame(step);
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
        playStartTimeRef.current = Date.now();
        // Track only first play per session
        if (!playedTracksThisSession.has(trackId)) {
          playedTracksThisSession.add(trackId);
          posthog.capture("played_track", { trackId, title });
        }
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
    // Track listening duration
    if (playStartTimeRef.current) {
      const listenedSeconds = Math.round(
        (Date.now() - playStartTimeRef.current) / 1000
      );
      posthog.capture("listening_duration", {
        trackId,
        title,
        durationSeconds: listenedSeconds,
      });
      playStartTimeRef.current = null;
    }
  };

  const handleToggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isActive) {
      if (audio.paused) {
        playAudio();
      } else {
        pauseAudio();
      }
      return;
    }

    onRequestPlay?.(trackId);
    playAudio();
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
      setPostPlayPulse(true);
      clearPostPulse();
      postPulseTimeoutRef.current = setTimeout(() => {
        setPostPlayPulse(false);
      }, 900);
      // Track listening duration on end
      if (playStartTimeRef.current) {
        const listenedSeconds = Math.round(
          (Date.now() - playStartTimeRef.current) / 1000
        );
        posthog.capture("listening_duration", {
          trackId,
          title,
          durationSeconds: listenedSeconds,
        });
        playStartTimeRef.current = null;
      }
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    const setDurationFromAudio = () => {
      if (!Number.isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    audio.addEventListener("loadedmetadata", setDurationFromAudio);
    audio.addEventListener("durationchange", setDurationFromAudio);
    setDurationFromAudio();

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("loadedmetadata", setDurationFromAudio);
      audio.removeEventListener("durationchange", setDurationFromAudio);
      cancelRaf();
      clearPostPulse();
    };
  }, []);

  useEffect(() => {
    if (!isActive && isPlaying) {
      pauseAudio();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isPlaying]);

  const highlightBounds = useMemo(() => {
    if (!duration || Number.isNaN(duration)) return null;
    const startRatio = Math.max(0, Math.min(1, highlightStart / duration));
    const endRatio = Math.max(startRatio, Math.min(1, highlightEnd / duration));

    // Calculate actual highlighted bar indices
    let firstHighlightedIndex = -1;
    let lastHighlightedIndex = -1;
    for (let i = 0; i < bars.length; i++) {
      const isHighlighted =
        i / bars.length < endRatio && (i + 1) / bars.length > startRatio;
      if (isHighlighted) {
        if (firstHighlightedIndex === -1) firstHighlightedIndex = i;
        lastHighlightedIndex = i;
      }
    }

    // Calculate center position based on actual bar indices
    const centerIndex = (firstHighlightedIndex + lastHighlightedIndex + 1) / 2;
    const centerRatio = centerIndex / bars.length;

    return {
      startRatio,
      endRatio,
      firstHighlightedIndex,
      lastHighlightedIndex,
      centerRatio,
    };
  }, [duration, bars.length, highlightStart, highlightEnd]);

  const handleHighlightClick = () => {
    const audio = audioRef.current;
    if (!audio) return;

    // Request to become active track
    onRequestPlay?.(trackId);

    // Seek to highlight start
    audio.currentTime = highlightStart;

    // Always start playing
    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        startRaf();
        // Track only first highlight play per session
        if (!playedHighlightsThisSession.has(trackId)) {
          playedHighlightsThisSession.add(trackId);
          posthog.capture("played_highlight", { trackId, title });
        }
      })
      .catch(() => {
        setIsPlaying(false);
        cancelRaf();
      });
  };

  return (
    <div className="flex w-full flex-col gap-2 text-[var(--background)]">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-[var(--accent)] via-rose-400 to-indigo-500">
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
        <div className="flex flex-col gap-1">
          <p className="eyebrow text-xs" style={{ color: "#f5f5f5" }}>
            {subtitle}
          </p>
          <h2 className="audio-title text-xl">{title}</h2>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleToggle}
          className="inline-flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl text-[var(--accent)] transition hover:text-[#ff6a2e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]/70 focus-visible:outline-offset-2 focus-visible:outline-[var(--background)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
          aria-pressed={isPlaying}
          aria-label={isPlaying ? "Pause track" : "Play track"}
        >
          {isPlaying ? (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <rect x="5" y="4" width="5" height="16" rx="1.2" />
              <rect x="14" y="4" width="5" height="16" rx="1.2" />
            </svg>
          ) : (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M6 4.5v15a1 1 0 0 0 1.52.85l12-7.5a1 1 0 0 0 0-1.7l-12-7.5A1 1 0 0 0 6 4.5Z" />
            </svg>
          )}
        </button>

        <div className="relative flex flex-1 items-center gap-[2px] py-2 pb-4 sm:gap-[7px] sm:py-3 sm:pb-5">
          {highlightBounds ? (
            <button
              type="button"
              onClick={handleHighlightClick}
              className="absolute cursor-pointer text-[10px] font-semibold tracking-[0.3em] whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]/70"
              style={{
                left: `${highlightBounds.centerRatio * 100}%`,
                transform: "translateX(calc(-50% - 0.15em))",
                bottom: -6,
                color: HIGHLIGHT_COLOR,
              }}
              aria-label="Play highlighted clip"
            >
              HIGHLIGHTED
            </button>
          ) : null}
          {bars.map((height, index) => {
            const position = progress * bars.length;
            const fillAmount = Math.min(1, Math.max(0, position - index));
            const filled = index < Math.floor(position);
            const intensity = filled ? 1 : 0.35 + fillAmount * 0.65;
            const scale = 1 + fillAmount * 0.25;
            const delay = `${index * 18}ms`;
            const animateClass =
              isPlaying && filled
                ? "animate-wave-active"
                : postPlayPulse && !filled
                ? "animate-wave-late"
                : "";
            const isHighlighted =
              highlightBounds &&
              index / bars.length < highlightBounds.endRatio &&
              (index + 1) / bars.length > highlightBounds.startRatio;

            // Faded colors when not playing, bright when playing
            const baseColor = filled
              ? ACCENT
              : isPlaying
              ? BASE_BAR
              : BASE_BAR_FADED;
            const highlightColor = isPlaying
              ? HIGHLIGHT_COLOR
              : HIGHLIGHT_COLOR_FADED;
            const barColor = isHighlighted ? highlightColor : baseColor;

            return (
              <button
                key={index}
                type="button"
                onClick={() => handleBarClick(index)}
                className="group relative h-14 w-[3px] cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] sm:h-20 sm:w-[6px]"
                aria-label={`Seek to ${(index / bars.length) * 100}%`}
              >
                <span
                  className={`absolute inset-x-0 rounded-full transition group-hover:bg-[var(--accent)]/85 ${animateClass}`}
                  style={{
                    height: `${height}%`,
                    top: "50%",
                    transform: `translateY(-50%) scaleY(${scale})`,
                    backgroundColor: barColor,
                    opacity: filled ? intensity : 0.9,
                    transition:
                      "background-color 480ms ease-in-out, opacity 240ms ease, transform 160ms ease",
                    animationDelay: delay,
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
