"use client";

import Image from "next/image";
import { track } from "@vercel/analytics";

type Spark = {
  id: string;
  title: string;
  cover: string;
  accent: string;
  offset: number;
};

const defaultSparks: Spark[] = [
  {
    id: "late-night-drive",
    title: "Poetic orchestras",
    cover: "/spark-cover-image/01.jpeg",
    accent: "rgba(255, 69, 0, 0.4)",
    offset: -40,
  },
  {
    id: "analog-textures",
    title: "Shared nostalgia",
    cover: "/spark-cover-image/04.jpeg",
    accent: "rgba(255, 69, 0, 0.35)",
    offset: -10,
  },
  {
    id: "cinema-grain",
    title: "Imagined worlds",
    cover: "/spark-cover-image/03.jpeg",
    accent: "rgba(255, 69, 0, 0.3)",
    offset: 20,
  },
  {
    id: "coastal-air",
    title: "Myths and sagas",
    cover: "/spark-cover-image/02.jpeg",
    accent: "rgba(255, 69, 0, 0.25)",
    offset: 50,
  },
];

type SparksProps = {
  items?: Spark[];
  onSelect?: (id: string) => void;
  activeId?: string | null;
};

export default function Sparks({ items, onSelect, activeId }: SparksProps) {
  const sparks = items ?? defaultSparks;
  return (
    <div className="relative h-60 w-full overflow-hidden sm:h-64 sm:overflow-visible">
      <div className="relative h-full w-full max-w-[320px] sm:max-w-none mx-auto sm:mx-0">
        {sparks.map((spark, idx) => {
          const baseClasses =
            "group absolute bottom-0 cursor-pointer transition-all duration-200 left-[var(--offset-mobile)] sm:left-[var(--offset-desktop)]";
          const isActive = activeId === spark.id;
          const zIndex = sparks.length - idx; // ensure earlier items sit above later ones
          const stateClasses = isActive
            ? "-translate-y-3 sm:-translate-y-4 opacity-100"
            : "translate-y-0 opacity-100";

          return (
            <div
              key={spark.title}
              className={`${baseClasses} ${stateClasses}`}
              style={
                {
                  "--offset-mobile": `calc(${idx} * min(2.8rem, 12vw))`,
                  "--offset-desktop": `calc(${idx} * 5.5rem + 0.5rem)`,
                  zIndex,
                } as React.CSSProperties
              }
              onClick={() => {
                track("clicked_spark", { sparkId: spark.id, sparkTitle: spark.title });
                onSelect?.(spark.id);
              }}
            >
              <div className="relative h-36 w-36 overflow-hidden rounded-2xl bg-[var(--background-alt)] shadow-[0_10px_35px_rgba(0,0,0,0.12)] ring-1 ring-white/50 transition duration-200 ease-out group-hover:-translate-y-3 group-hover:scale-[1.02] group-hover:shadow-[0_24px_55px_rgba(0,0,0,0.2)] sm:h-48 sm:w-48">
                <Image
                  src={spark.cover}
                  alt={spark.title}
                  fill
                  sizes="(min-width: 640px) 12rem, 9rem"
                  className={`object-cover saturate-105 ${
                    idx === 2 ? "-scale-x-100" : ""
                  }`}
                  priority={idx === 0}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(180deg, ${spark.accent}, transparent 55%)`,
                  }}
                />
                <div className="absolute inset-0 rounded-3xl ring-1 ring-black/5" />
              </div>
              <div className="pointer-events-none absolute -top-12 left-1/2 w-max -translate-x-1/2 rounded-full bg-white/90 px-3 py-2 text-xs text-[var(--foreground)] opacity-0 shadow-md transition duration-150 group-hover:-translate-y-1 group-hover:opacity-100">
                {spark.title}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
