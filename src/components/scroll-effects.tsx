"use client";

import { useEffect } from "react";

/**
 * Dependency-free scroll choreography for the marketing pages.
 *
 * Markup API (all opt-in via data attributes, so pages can stay server components):
 * - `data-reveal="up|fade|left|right|scale|blur|mask|lines"`
 *     Element animates in once it enters the viewport (`data-visible` is set).
 * - `data-reveal-stagger="90"`
 *     On a parent: assigns an incremental `--reveal-delay` to its `[data-reveal]` descendants.
 * - `data-scroll-progress="through|exit|draw"`
 *     Element receives a live `--p` (0 → 1) CSS variable describing its scroll position.
 * - `data-header`       → receives `data-scrolled="true|false"`.
 * - `data-page-progress` → receives `--p` for the whole document.
 * - `data-nav="<section-id>"` → receives `data-active="true"` while that section is in view.
 */
export default function ScrollEffects() {
  useEffect(() => {
    const doc = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- Stagger groups ---------- */
    document.querySelectorAll<HTMLElement>("[data-reveal-stagger]").forEach((group) => {
      const step = Number(group.dataset.revealStagger) || 90;
      group.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el, i) => {
        if (!el.style.getPropertyValue("--reveal-delay")) {
          el.style.setProperty("--reveal-delay", `${i * step}ms`);
        }
      });
    });

    /* ---------- Reveal on enter ---------- */
    const revealEls = document.querySelectorAll<HTMLElement>("[data-reveal]");
    let revealObserver: IntersectionObserver | undefined;

    if (reduced || !("IntersectionObserver" in window)) {
      revealEls.forEach((el) => (el.dataset.visible = "true"));
    } else {
      revealObserver = new IntersectionObserver(
        (entries, observer) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            (entry.target as HTMLElement).dataset.visible = "true";
            observer.unobserve(entry.target);
          }
        },
        { rootMargin: "0px 0px -10% 0px", threshold: 0.15 },
      );
      revealEls.forEach((el) => revealObserver!.observe(el));
    }

    /* ---------- Active navigation ---------- */
    const navLinks = document.querySelectorAll<HTMLElement>("[data-nav]");
    const sections = Array.from(navLinks)
      .map((link) => document.getElementById(link.dataset.nav ?? ""))
      .filter((el): el is HTMLElement => Boolean(el));

    const navObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          navLinks.forEach((link) => {
            link.dataset.active = String(link.dataset.nav === entry.target.id);
          });
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((section) => navObserver.observe(section));

    /* ---------- Scroll-linked values ---------- */
    const header = document.querySelector<HTMLElement>("[data-header]");
    const pageBar = document.querySelector<HTMLElement>("[data-page-progress]");
    const progressEls = Array.from(
      document.querySelectorAll<HTMLElement>("[data-scroll-progress]"),
    );

    const clamp = (n: number) => Math.min(1, Math.max(0, n));
    let frame = 0;

    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      const y = window.scrollY;
      const max = doc.scrollHeight - vh;

      pageBar?.style.setProperty("--p", (max > 0 ? y / max : 0).toFixed(4));
      if (header) header.dataset.scrolled = String(y > 24);

      if (reduced) return;

      for (const el of progressEls) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) continue; // far off-screen

        let p: number;
        switch (el.dataset.scrollProgress) {
          case "exit": // 0 when top hits viewport top, 1 when it has fully scrolled away
            p = -r.top / Math.max(r.height, 1);
            break;
          case "draw": {
            // 0 when top reaches 80% of viewport, 1 when bottom reaches 45%
            const start = vh * 0.8;
            const end = vh * 0.45;
            p = (start - r.top) / Math.max(r.height + start - end, 1);
            break;
          }
          default: // "through": 0 when entering at the bottom, 1 when leaving at the top
            p = (vh - r.top) / (vh + r.height);
        }
        el.style.setProperty("--p", clamp(p).toFixed(4));
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      revealObserver?.disconnect();
      navObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}

