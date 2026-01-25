"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePostHog } from "posthog-js/react";
import Track from "./Track";

// Track unique cassette clicks per session
const clickedCassettesThisSession = new Set<string>();

export type CassetteTheme = {
  primary: string;
  secondary: string;
  accent: string;
  labelBg: string;
  labelText: string;
  reelColor: string;
  tapeColor: string;
  pattern?: "dots" | "lines" | "waves" | "grid";
};

type CassetteData = {
  id: string;
  trackId: string;
  title: string;
  subtitle: string;
  src: string;
  highlightStart: number;
  highlightEnd: number;
  theme: CassetteTheme;
};

const cassettes: CassetteData[] = [
  {
    id: "late-night-drive",
    trackId: "the-quiet-brave-lily",
    title: "The Quiet Brave Lily",
    subtitle: "Nostalgic, fragile yet hopeful",
    src: "https://media.egecam.dev/audio/the_quiet_brave_lily.wav",
    highlightStart: 81,
    highlightEnd: 95,
    theme: {
      primary: "#f8e4d9", // warm cream
      secondary: "#e8c4b8", // dusty rose
      accent: "#d4a574", // vintage gold
      labelBg: "#fff8f0",
      labelText: "#6b4423",
      reelColor: "#8b6914",
      tapeColor: "#2d1810",
      pattern: "dots",
    },
  },
  {
    id: "analog-textures",
    trackId: "flip-flops",
    title: "Flip-flops",
    subtitle: "Lively seaside longing",
    src: "https://media.egecam.dev/audio/flip-flop.wav",
    highlightStart: 116,
    highlightEnd: 135,
    theme: {
      primary: "#87ceeb", // sky blue
      secondary: "#f4d35e", // sandy yellow
      accent: "#ff6b35", // sunset orange
      labelBg: "#fffef0",
      labelText: "#1e3a5f",
      reelColor: "#2d5a7b",
      tapeColor: "#1a3d5c",
      pattern: "waves",
    },
  },
  {
    id: "cinema-grain",
    trackId: "spellsire",
    title: "Spellsire",
    subtitle: "Neo-noir digital folk",
    src: "https://media.egecam.dev/audio/spellsire.wav",
    highlightStart: 138,
    highlightEnd: 157,
    theme: {
      primary: "#c4b5fd", // light purple (visible on dark bg)
      secondary: "#16213e", // midnight blue
      accent: "#e94560", // neon pink
      labelBg: "#0f0f1a",
      labelText: "#a855f7",
      reelColor: "#7c3aed",
      tapeColor: "#312e81",
      pattern: "grid",
    },
  },
  {
    id: "coastal-air",
    trackId: "monuments",
    title: "Monuments",
    subtitle: "Mythic voice of ancient stones",
    src: "https://media.egecam.dev/audio/monuments.wav",
    highlightStart: 64,
    highlightEnd: 80,
    theme: {
      primary: "#d4c4a8", // sandstone
      secondary: "#a67c52", // bronze
      accent: "#5c4033", // earth brown
      labelBg: "#f5f0e6",
      labelText: "#3d2914",
      reelColor: "#8b5a2b",
      tapeColor: "#2d1f14",
      pattern: "lines",
    },
  },
];

type CassettePlayerProps = {
  onTrackChange?: (trackId: string) => void;
  activeTrackId?: string | null;
  onRequestPlay?: (id: string) => void;
};

function CassettePattern({
  pattern,
  color,
  id,
}: {
  pattern?: string;
  color: string;
  id: string;
}) {
  if (!pattern) return null;

  const patternStyle = { opacity: 0.15 };
  const patternId = `${pattern}-${id}`;

  switch (pattern) {
    case "dots":
      return (
        <svg className="absolute inset-0 h-full w-full" style={patternStyle}>
          <pattern
            id={patternId}
            x="0"
            y="0"
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1" fill={color} />
          </pattern>
          <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </svg>
      );
    case "lines":
      return (
        <svg className="absolute inset-0 h-full w-full" style={patternStyle}>
          <pattern
            id={patternId}
            x="0"
            y="0"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
          >
            <line x1="0" y1="6" x2="6" y2="0" stroke={color} strokeWidth="1" />
          </pattern>
          <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </svg>
      );
    case "waves":
      return (
        <svg className="absolute inset-0 h-full w-full" style={patternStyle}>
          <pattern
            id={patternId}
            x="0"
            y="0"
            width="20"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 5 Q5 0 10 5 T20 5"
              fill="none"
              stroke={color}
              strokeWidth="1"
            />
          </pattern>
          <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </svg>
      );
    case "grid":
      return (
        <svg className="absolute inset-0 h-full w-full" style={patternStyle}>
          <pattern
            id={patternId}
            x="0"
            y="0"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <rect
              width="10"
              height="10"
              fill="none"
              stroke={color}
              strokeWidth="0.5"
            />
          </pattern>
          <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </svg>
      );
    default:
      return null;
  }
}

function Cassette({
  data,
  isActive,
  isPlaying,
  onClick,
  style,
}: {
  data: CassetteData;
  isActive: boolean;
  isPlaying: boolean;
  onClick: () => void;
  style?: React.CSSProperties;
}) {
  const { theme, title, id } = data;

  return (
    <div
      className={`cassette-wrapper absolute transition-all duration-500 ease-out ${
        isActive ? "z-20" : "z-10"
      }`}
      style={style}
      onClick={onClick}
    >
      <div
        className={`cassette relative cursor-pointer transition-all duration-300 ${
          isActive
            ? "scale-100 opacity-100"
            : "scale-90 opacity-60 hover:opacity-80"
        }`}
      >
        {/* Cassette body */}
        <div
          className="w-[180px] h-[114px] sm:w-[240px] sm:h-[152px] rounded-lg shadow-lg transition-shadow duration-300"
          style={{
            background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
            boxShadow: isActive
              ? `0 20px 40px -10px rgba(0,0,0,0.3), 0 0 0 2px ${theme.accent}40`
              : "0 8px 20px -5px rgba(0,0,0,0.2)",
          }}
        >
          <CassettePattern pattern={theme.pattern} color={theme.accent} id={id} />

          {/* Top edge detail */}
          <div
            className="absolute top-0 left-3 right-3 sm:left-4 sm:right-4 h-[3px] sm:h-1 rounded-b-sm"
            style={{ backgroundColor: theme.accent, opacity: 0.4 }}
          />

          {/* Screw holes */}
          <div className="absolute top-[6px] left-[6px] sm:top-2 sm:left-2 h-2 w-2 sm:h-3 sm:w-3 rounded-full"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${theme.secondary}, ${theme.accent})`,
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)",
            }}
          />
          <div className="absolute top-[6px] right-[6px] sm:top-2 sm:right-2 h-2 w-2 sm:h-3 sm:w-3 rounded-full"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${theme.secondary}, ${theme.accent})`,
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)",
            }}
          />
          <div className="absolute bottom-[6px] left-[6px] sm:bottom-2 sm:left-2 h-2 w-2 sm:h-3 sm:w-3 rounded-full"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${theme.secondary}, ${theme.accent})`,
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)",
            }}
          />
          <div className="absolute bottom-[6px] right-[6px] sm:bottom-2 sm:right-2 h-2 w-2 sm:h-3 sm:w-3 rounded-full"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${theme.secondary}, ${theme.accent})`,
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)",
            }}
          />

          {/* Label area */}
          <div
            className="absolute left-3 right-3 top-4 sm:left-4 sm:right-4 sm:top-6 rounded-md p-2 sm:p-3"
            style={{
              backgroundColor: theme.labelBg,
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div
              className="text-center text-[8px] sm:text-[10px] font-bold uppercase tracking-widest"
              style={{ color: theme.labelText, opacity: 0.6 }}
            >
              Side A
            </div>
            <div
              className="mt-0.5 sm:mt-1 truncate text-center text-xs sm:text-sm font-semibold"
              style={{ color: theme.labelText }}
            >
              {title}
            </div>
            {/* Label lines */}
            <div className="mt-1 sm:mt-2 space-y-0.5 sm:space-y-1">
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="h-[1px]"
                  style={{ backgroundColor: theme.labelText, opacity: 0.15 }}
                />
              ))}
            </div>
          </div>

          {/* Tape window */}
          <div
            className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 overflow-hidden rounded-md w-[120px] h-[28px] sm:w-[160px] sm:h-[40px]"
            style={{
              backgroundColor: "#1a1a1a",
              boxShadow: "inset 0 2px 8px rgba(0,0,0,0.5)",
            }}
          >
            {/* Tape reels */}
            <div className="absolute inset-0 flex items-center justify-between px-4 sm:px-6">
              {[0, 1].map((reelIndex) => (
                <div
                  key={reelIndex}
                  className={`relative h-5 w-5 sm:h-7 sm:w-7 rounded-full ${
                    isPlaying ? "animate-spin-slow" : ""
                  }`}
                  style={{
                    backgroundColor: theme.reelColor,
                    boxShadow: `0 0 0 2px ${theme.tapeColor}, inset 0 0 4px rgba(0,0,0,0.5)`,
                  }}
                >
                  {/* Reel spokes */}
                  {[0, 60, 120, 180, 240, 300].map((rotation) => (
                    <div
                      key={rotation}
                      className="absolute left-1/2 top-1/2 h-[1.5px] sm:h-[2px] w-2 sm:w-3"
                      style={{
                        backgroundColor: theme.tapeColor,
                        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                        transformOrigin: "center",
                      }}
                    />
                  ))}
                  {/* Center hole */}
                  <div
                    className="absolute left-1/2 top-1/2 h-1.5 w-1.5 sm:h-2 sm:w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ backgroundColor: "#1a1a1a" }}
                  />
                </div>
              ))}
            </div>

            {/* Tape between reels */}
            <div
              className="absolute left-1/2 top-1/2 h-3 w-8 sm:h-5 sm:w-14 -translate-x-1/2 -translate-y-1/2"
              style={{
                backgroundColor: theme.tapeColor,
                opacity: 0.8,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CassettePlayer({
  activeTrackId,
  onRequestPlay,
}: CassettePlayerProps) {
  const posthog = usePostHog();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackAnimState, setTrackAnimState] = useState<"in" | "out">("in");
  const [displayedCassette, setDisplayedCassette] = useState<CassetteData>(
    cassettes[0]
  );
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect mobile on client
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const currentCassette = cassettes[currentIndex];

  // Handle cassette change animation
  useEffect(() => {
    if (currentCassette.id === displayedCassette.id) return;

    // Use setTimeout to avoid synchronous setState in effect
    const animOutTimeout = setTimeout(() => {
      setTrackAnimState("out");
    }, 0);

    const swapTimeout = setTimeout(() => {
      setIsPlaying(false);
      setDisplayedCassette(currentCassette);
      setTrackAnimState("in");
    }, 260);

    return () => {
      clearTimeout(animOutTimeout);
      clearTimeout(swapTimeout);
    };
  }, [currentCassette, displayedCassette]);

  const handleCassetteClick = useCallback(
    (index: number) => {
      const cassette = cassettes[index];

      // Track only first click per session
      if (!clickedCassettesThisSession.has(cassette.id)) {
        clickedCassettesThisSession.add(cassette.id);
        posthog.capture("clicked_cassette", {
          cassetteId: cassette.id,
          cassetteTitle: cassette.title,
        });
      }

      setCurrentIndex(index);
    },
    [posthog]
  );

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? cassettes.length - 1 : prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === cassettes.length - 1 ? 0 : prev + 1));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrev, handleNext]);

  const getVisibleCassettes = () => {
    const visible: { cassette: CassetteData; position: number; index: number }[] = [];
    const totalCassettes = cassettes.length;

    // Show current, previous, and next
    for (let offset = -1; offset <= 1; offset++) {
      let index = currentIndex + offset;
      if (index < 0) index = totalCassettes + index;
      if (index >= totalCassettes) index = index - totalCassettes;

      visible.push({
        cassette: cassettes[index],
        position: offset,
        index,
      });
    }

    return visible;
  };

  return (
    <div className="cassette-player w-full">
      {/* Cassette carousel */}
      <div className="relative mb-6 sm:mb-8">
        <div
          ref={containerRef}
          className="relative mx-auto flex h-[160px] sm:h-[200px] items-center justify-center"
          style={{ maxWidth: "500px" }}
        >
          {/* Navigation arrows */}
          <button
            onClick={handlePrev}
            className="absolute -left-2 sm:left-0 z-30 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/80 text-[var(--foreground)] shadow-md backdrop-blur-sm transition-all hover:bg-white hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            aria-label="Previous cassette"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Cassettes */}
          <div className="relative h-full w-full">
            {getVisibleCassettes().map(({ cassette, position, index }) => {
              const isCenter = position === 0;
              const xOffset = position * (isMobile ? 70 : 100);
              const scale = isCenter ? 1 : 0.75;
              const opacity = isCenter ? 1 : 0.4;
              const zIndex = isCenter ? 20 : 10;

              return (
                <Cassette
                  key={cassette.id}
                  data={cassette}
                  isActive={isCenter}
                  isPlaying={isPlaying && isCenter}
                  onClick={() => handleCassetteClick(index)}
                  style={{
                    left: "50%",
                    top: "50%",
                    transform: `translate(calc(-50% + ${xOffset}px), -50%) scale(${scale})`,
                    opacity,
                    zIndex,
                  }}
                />
              );
            })}
          </div>

          <button
            onClick={handleNext}
            className="absolute -right-2 sm:right-0 z-30 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/80 text-[var(--foreground)] shadow-md backdrop-blur-sm transition-all hover:bg-white hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            aria-label="Next cassette"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Cassette indicator dots */}
        <div className="mt-4 flex justify-center gap-2">
          {cassettes.map((cassette, index) => (
            <button
              key={cassette.id}
              onClick={() => handleCassetteClick(index)}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "w-6 bg-[var(--accent)]"
                  : "bg-[var(--foreground)]/20 hover:bg-[var(--foreground)]/40"
              }`}
              aria-label={`Go to ${cassette.title}`}
            />
          ))}
        </div>
      </div>

      {/* Track player */}
      <div
        className={`rounded-3xl border border-black/15 bg-[#1f1f1f] px-4 py-5 sm:px-6 sm:py-6 overflow-hidden [transform-origin:bottom] ${
          trackAnimState === "in" ? "animate-genie-in" : "animate-genie-out"
        }`}
      >
        <Track
          key={displayedCassette.trackId}
          trackId={displayedCassette.trackId}
          isActive={activeTrackId === displayedCassette.trackId}
          onRequestPlay={(id) => {
            onRequestPlay?.(id);
          }}
          onPlayStateChange={(playing) => {
            setIsPlaying(playing);
          }}
          src={displayedCassette.src}
          title={displayedCassette.title}
          subtitle={displayedCassette.subtitle}
          highlightStart={displayedCassette.highlightStart}
          highlightEnd={displayedCassette.highlightEnd}
          theme={displayedCassette.theme}
        />
      </div>
    </div>
  );
}
