"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePostHog } from "posthog-js/react";
import type { CassetteTheme } from "./CassettePlayer";

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
  onPlayStateChange?: (isPlaying: boolean) => void;
  highlightStart?: number;
  highlightEnd?: number;
  theme?: CassetteTheme;
};

const defaultTheme: CassetteTheme = {
  primary: "#d4c4a8",
  secondary: "#a67c52",
  accent: "#5c4033",
  labelBg: "#f5f0e6",
  labelText: "#3d2914",
  reelColor: "#8b5a2b",
  tapeColor: "#2d1f14",
};

export default function Track({
  trackId,
  src = "https://media.egecam.dev/audio/monuments.wav",
  title = "Monuments",
  subtitle = "Introductory subtitle",
  isActive = false,
  onRequestPlay,
  onPlayStateChange,
  highlightStart = 60,
  highlightEnd = 75,
  theme = defaultTheme,
}: TrackProps) {
  const posthog = usePostHog();
  const HIGHLIGHT_COLOR = "#facc15";
  const HIGHLIGHT_COLOR_FADED = "#b8a033";
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const postPulseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playStartTimeRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isActive && isPlaying) {
      pauseAudio();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isPlaying]);

  useEffect(() => {
    onPlayStateChange?.(isPlaying);
  }, [isPlaying, onPlayStateChange]);

  const highlightBounds = useMemo(() => {
    if (!duration || Number.isNaN(duration)) return null;
    const startRatio = Math.max(0, Math.min(1, highlightStart / duration));
    const endRatio = Math.max(startRatio, Math.min(1, highlightEnd / duration));

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

    onRequestPlay?.(trackId);
    audio.currentTime = highlightStart;

    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        startRaf();
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

  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const currentTime = duration ? progress * duration : 0;

  return (
    <div className="flex w-full flex-col gap-3">
      {/* Tape deck header with track info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mini cassette icon */}
          <div
            className={`relative h-10 w-14 rounded-md transition-all duration-500 ${
              isPlaying ? "animate-pulse-subtle" : ""
            }`}
            style={{
              background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
              boxShadow: isPlaying
                ? `0 0 20px ${theme.accent}40, 0 4px 12px rgba(0,0,0,0.2)`
                : "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            {/* Mini tape window */}
            <div
              className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1 rounded-sm"
              style={{
                width: "36px",
                height: "12px",
                backgroundColor: "#1a1a1a",
              }}
            >
              {/* Mini reels */}
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-full ${
                    isPlaying ? "animate-spin-slow" : ""
                  }`}
                  style={{ backgroundColor: theme.reelColor }}
                />
              ))}
            </div>
            {/* Label strip */}
            <div
              className="absolute top-1 left-1 right-1 h-4 rounded-sm flex items-center justify-center"
              style={{ backgroundColor: theme.labelBg }}
            >
              <span
                className="text-[6px] font-bold uppercase tracking-wider truncate px-1"
                style={{ color: theme.labelText }}
              >
                {title.slice(0, 12)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <p
              className="text-[10px] sm:text-xs font-medium uppercase tracking-widest transition-opacity duration-300"
              style={{
                color: theme.primary,
                opacity: isPlaying ? 1 : 0.6,
              }}
            >
              {subtitle}
            </p>
            <h2
              className="text-lg sm:text-xl font-bold transition-all duration-300"
              style={{
                color: isPlaying ? "#ffffff" : "#e5e5e5",
                textShadow: isPlaying ? `0 0 20px ${theme.accent}60` : "none",
              }}
            >
              {title}
            </h2>
          </div>
        </div>

        {/* Time display - tape counter style */}
        <div
          className={`font-mono text-sm sm:text-base tracking-wider transition-all duration-500 ${
            isPlaying ? "opacity-100" : "opacity-40"
          }`}
          style={{
            color: theme.primary,
            textShadow: isPlaying ? `0 0 10px ${theme.primary}` : "none",
          }}
        >
          {formatTime(currentTime)}
          <span className="opacity-50"> / {duration ? formatTime(duration) : "--:--"}</span>
        </div>
      </div>

      {/* Main player controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Play/Pause button - tape deck style */}
        <button
          type="button"
          onClick={handleToggle}
          className={`relative flex h-12 w-12 sm:h-14 sm:w-14 cursor-pointer items-center justify-center rounded-xl transition-all duration-300 ${
            isPlaying ? "scale-105" : "hover:scale-105"
          }`}
          style={{
            background: isPlaying
              ? `linear-gradient(135deg, ${theme.accent} 0%, ${theme.secondary} 100%)`
              : `linear-gradient(135deg, ${theme.primary}80 0%, ${theme.secondary}60 100%)`,
            boxShadow: isPlaying
              ? `0 0 30px ${theme.accent}50, 0 4px 15px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)`
              : "0 2px 10px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
          aria-pressed={isPlaying}
          aria-label={isPlaying ? "Pause track" : "Play track"}
        >
          {/* Glow ring when playing */}
          <div
            className={`absolute inset-0 rounded-xl transition-opacity duration-500 ${
              isPlaying ? "opacity-100 animate-glow-pulse" : "opacity-0"
            }`}
            style={{
              boxShadow: `0 0 20px ${theme.accent}60`,
            }}
          />
          {isPlaying ? (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill={theme.labelBg}
              aria-hidden
              className="relative z-10"
            >
              <rect x="5" y="4" width="5" height="16" rx="1.2" />
              <rect x="14" y="4" width="5" height="16" rx="1.2" />
            </svg>
          ) : (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill={theme.labelBg}
              aria-hidden
              className="relative z-10 translate-x-0.5"
            >
              <path d="M6 4.5v15a1 1 0 0 0 1.52.85l12-7.5a1 1 0 0 0 0-1.7l-12-7.5A1 1 0 0 0 6 4.5Z" />
            </svg>
          )}
        </button>

        {/* VU Meter / Waveform display */}
        <div
          className="relative flex-1 rounded-lg p-2 sm:p-3 overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)",
            boxShadow:
              "inset 0 2px 10px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Scanline effect when playing */}
          <div
            className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
              isPlaying ? "opacity-30" : "opacity-0"
            }`}
            style={{
              background:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)",
            }}
          />

          {/* Glow overlay when playing */}
          <div
            className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${
              isPlaying ? "opacity-100" : "opacity-0"
            }`}
            style={{
              background: `radial-gradient(ellipse at ${progress * 100}% 50%, ${theme.accent}20 0%, transparent 50%)`,
            }}
          />

          {/* Highlighted section label */}
          {highlightBounds && (
            <button
              type="button"
              onClick={handleHighlightClick}
              className={`absolute z-20 cursor-pointer text-[8px] sm:text-[10px] font-bold tracking-[0.2em] whitespace-nowrap transition-all duration-500 ${
                isPlaying
                  ? "opacity-100 animate-highlight-glow"
                  : "opacity-60 hover:opacity-100"
              }`}
              style={{
                left: `${highlightBounds.centerRatio * 100}%`,
                transform: "translateX(-50%)",
                bottom: "2px",
                color: HIGHLIGHT_COLOR,
                textShadow: isPlaying ? `0 0 8px ${HIGHLIGHT_COLOR}` : "none",
              }}
              aria-label="Play highlighted clip"
            >
              HIGHLIGHTED
            </button>
          )}

          {/* Waveform bars */}
          <div className="relative flex items-center gap-[1px] sm:gap-[3px] h-12 sm:h-16">
            {bars.map((height, index) => {
              const position = progress * bars.length;
              const fillAmount = Math.min(1, Math.max(0, position - index));
              const filled = index < Math.floor(position);
              const isHighlighted =
                highlightBounds &&
                index / bars.length < highlightBounds.endRatio &&
                (index + 1) / bars.length > highlightBounds.startRatio;

              // Dynamic colors based on playing state
              const baseColor = filled
                ? theme.accent
                : isPlaying
                ? theme.primary
                : `${theme.primary}60`;
              const highlightColor = isPlaying
                ? HIGHLIGHT_COLOR
                : HIGHLIGHT_COLOR_FADED;
              const barColor = isHighlighted ? highlightColor : baseColor;

              // Animation classes
              const animateClass =
                isPlaying && filled
                  ? "animate-bar-pulse"
                  : postPlayPulse && !filled
                  ? "animate-wave-late"
                  : "";

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleBarClick(index)}
                  className="group relative flex-1 h-full cursor-pointer focus:outline-none"
                  aria-label={`Seek to ${Math.round((index / bars.length) * 100)}%`}
                >
                  <span
                    className={`absolute inset-x-0 rounded-sm transition-all group-hover:brightness-125 ${animateClass}`}
                    style={{
                      height: `${height}%`,
                      top: "50%",
                      transform: `translateY(-50%) scaleY(${1 + fillAmount * 0.15})`,
                      backgroundColor: barColor,
                      opacity: filled ? 1 : isPlaying ? 0.5 : 0.25,
                      boxShadow:
                        filled && isPlaying
                          ? `0 0 8px ${barColor}80`
                          : "none",
                      transition:
                        "background-color 300ms ease, opacity 200ms ease, transform 150ms ease, box-shadow 300ms ease",
                    }}
                  />
                </button>
              );
            })}
          </div>

          {/* Progress indicator line */}
          <div
            className={`absolute bottom-0 left-0 h-[2px] transition-all duration-300 ${
              isPlaying ? "opacity-100" : "opacity-50"
            }`}
            style={{
              width: `${progress * 100}%`,
              background: `linear-gradient(90deg, ${theme.accent}, ${theme.primary})`,
              boxShadow: isPlaying ? `0 0 10px ${theme.accent}` : "none",
            }}
          />
        </div>
      </div>

      {/* Recording indicator - visible when playing */}
      <div
        className={`flex items-center justify-center gap-2 transition-all duration-500 ${
          isPlaying
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <div
          className="h-2 w-2 rounded-full animate-pulse"
          style={{ backgroundColor: theme.accent }}
        />
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.3em]"
          style={{ color: theme.primary }}
        >
          Now Playing
        </span>
        <div
          className="h-2 w-2 rounded-full animate-pulse"
          style={{ backgroundColor: theme.accent, animationDelay: "0.5s" }}
        />
      </div>

      <audio ref={audioRef} preload="metadata">
        <source src={src} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}
