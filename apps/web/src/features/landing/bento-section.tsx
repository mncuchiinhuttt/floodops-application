import type { PointerEvent } from "react";
import { Camera, MapPin, Route, ShieldCheck } from "lucide-react";
import phoneReport from "./assets/phone-report-composer.webp";
import { PHONE_SHOT, SHOTS } from "./landing-copy";
import { revealDelay } from "./use-reveal";

/** The pointer position drives CSS variables directly, so hovering never re-renders React. */
function trackPointer(event: PointerEvent<HTMLElement>) {
  const box = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--mx", `${event.clientX - box.left}px`);
  event.currentTarget.style.setProperty("--my", `${event.clientY - box.top}px`);
}
const FACTS = [["66", "contracted API operations"], ["3", "roles with separated permissions"], ["10", "replays in one evaluation run"]] as const;

export function BentoSection() {
  return <section id="ben-trong" className="landing-section" aria-labelledby="bento-title">
    <div className="landing-container">
      <h2 id="bento-title" className="section-title" data-reveal>Inside the demo</h2>
      <p className="section-lede" data-reveal style={revealDelay(60)}>Every piece runs on a real server. The data is simulated.</p>
      <div className="bento">
        <article className="bento-card bento-map" onPointerMove={trackPointer} data-reveal>
          <div className="bento-copy"><MapPin size={20} strokeWidth={1.75} aria-hidden="true" /><h3>Pick a road on the map</h3>
            <p>Use your device location or tap a road. Street names come from OpenStreetMap and the nearest simulated segment is assigned automatically.</p></div>
          <img src={SHOTS.picker.src} width={SHOTS.picker.width} height={SHOTS.picker.height} alt="" loading="lazy" />
        </article>
        <article className="bento-card bento-phone" onPointerMove={trackPointer} data-reveal style={revealDelay(80)}>
          <div className="bento-copy"><Camera size={20} strokeWidth={1.75} aria-hidden="true" /><h3>Works on a phone</h3>
            <p>A bottom tab bar and compact forms. Photos are normalized and stripped of metadata before saving.</p></div>
          <img src={phoneReport} width={PHONE_SHOT.width} height={PHONE_SHOT.height} alt="The FloodOps report form on a phone, with a Use my location button and a map." loading="lazy" />
        </article>
        <article className="bento-card bento-glow" onPointerMove={trackPointer} data-reveal style={revealDelay(60)}>
          <div className="bento-copy"><Route size={20} strokeWidth={1.75} aria-hidden="true" /><h3>Deterministic planner</h3>
            <p>The same input gives the same plan. No AI makes dispatch decisions.</p></div>
        </article>
        <article className="bento-card bento-grid" onPointerMove={trackPointer} data-reveal style={revealDelay(120)}>
          <div className="bento-copy"><ShieldCheck size={20} strokeWidth={1.75} aria-hidden="true" /><h3>Approval is not execution</h3>
            <p>Approve only records the decision. Execute re-checks evidence, revision and capacity before it commits.</p></div>
        </article>
        <article className="bento-card bento-facts" data-reveal>
          <dl>{FACTS.map(([value, label]) => <div key={label}><dt>{value}</dt><dd>{label}</dd></div>)}</dl>
        </article>
      </div>
    </div>
  </section>;
}
