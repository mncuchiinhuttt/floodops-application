import { useEffect, type CSSProperties, type RefObject } from "react";

/** Stagger offset consumed by the `[data-reveal]` transition in landing-base.css. */
export const revealDelay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/** Adds `is-visible` to [data-reveal] descendants as they enter the viewport. Reveals everything at once under reduced motion. */
export function useReveal(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const page = root.current;
    if (!page) return;
    const items = [...page.querySelectorAll<HTMLElement>("[data-reveal]")];
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined") {
      items.forEach(item => item.classList.add("is-visible"));
      return;
    }
    page.classList.add("motion-ready");
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }), { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    items.forEach(item => observer.observe(item));
    return () => { observer.disconnect(); page.classList.remove("motion-ready"); };
  }, [root]);
}
