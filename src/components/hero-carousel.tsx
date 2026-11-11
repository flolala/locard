"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

export type HeroSlide = {
  src: string;
  alt: string;
  caption: string;
};

const INTERVAL = 5200;

function subscribeReducedMotion(callback: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = usePrefersReducedMotion();
  const count = slides.length;

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  useEffect(() => {
    if (paused || reduced || count < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL);
    return () => clearInterval(timer);
  }, [paused, reduced, count]);

  return (
    <div
      className="group relative h-full w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Foto produk LOCARD"
    >
      {slides.map((slide, i) => {
        const active = i === index;
        return (
          <div
            key={slide.src}
            className={`absolute inset-0 transition-all duration-[1100ms] ease-[cubic-bezier(0.16,0.84,0.44,1)] ${
              active
                ? "translate-x-0 scale-100 opacity-100"
                : "pointer-events-none translate-x-[3%] scale-[1.02] opacity-0"
            }`}
            aria-hidden={!active}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.src}
              alt={slide.alt}
              className="h-full w-full object-cover"
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
            />
          </div>
        );
      })}

      {/* Legibility + brand overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#3d1319]/90 via-[#3d1319]/15 to-[#3d1319]/25" />

      <div className="absolute inset-x-0 bottom-0 px-6 pb-6">
        <p className="font-display text-lg text-cream transition-opacity duration-500">
          {slides[index]?.caption}
        </p>

        <div className="mt-4 flex items-center gap-1.5">
          {slides.map((slide, i) => {
            const active = i === index;
            return (
              <button
                key={slide.src}
                type="button"
                onClick={() => go(i)}
                aria-label={`Tampilkan ${slide.caption}`}
                aria-current={active}
                className="relative h-[3px] w-8 overflow-hidden rounded-full bg-cream/25 transition hover:bg-cream/40"
              >
                {active ? (
                  <span
                    className="absolute inset-0 origin-left rounded-full bg-cream"
                    style={{
                      animation: reduced
                        ? undefined
                        : `slide-progress ${INTERVAL}ms linear forwards`,
                      animationPlayState: paused ? "paused" : "running",
                    }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
