import { useEffect, useRef, useState } from "react";
import { FLOW_STEPS } from "./landing-copy";
import { revealDelay } from "./use-reveal";

/** Sticky storytelling: the stage image follows the step nearest the viewport centre; below 1000px each step shows its own image. */
export function FlowSection() {
  const [active, setActive] = useState(0);
  const steps = useRef<(HTMLLIElement | null)[]>([]);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting && entry.target instanceof HTMLElement) setActive(Number(entry.target.dataset.index));
    }), { rootMargin: "-42% 0px -42% 0px" });
    steps.current.forEach(step => { if (step) observer.observe(step); });
    return () => observer.disconnect();
  }, []);
  return <section id="quy-trinh" className="landing-section flow" aria-labelledby="flow-title">
    <div className="landing-container">
      <h2 id="flow-title" className="section-title" data-reveal>From report to decision</h2>
      <p className="section-lede" data-reveal style={revealDelay(60)}>Four steps in one simulated session. Every image on this page is captured from the running app.</p>
      <div className="flow-grid">
        <ol className="flow-steps">
          {FLOW_STEPS.map((step, index) => <li key={step.id} ref={node => { steps.current[index] = node; }} data-index={index} data-active={index === active} className="flow-step">
            <span className="flow-icon"><step.icon size={20} strokeWidth={1.75} aria-hidden="true" /></span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
            <img className="flow-inline" src={step.shot.src} width={step.shot.width} height={step.shot.height} alt={step.shot.alt} loading="lazy" />
          </li>)}
        </ol>
        <div className="flow-stage">
          <div className="flow-frame">
            {FLOW_STEPS.map((step, index) => <img key={step.id} data-active={index === active} src={step.shot.src} width={step.shot.width} height={step.shot.height} alt={index === active ? step.shot.alt : ""} loading="lazy" />)}
          </div>
        </div>
      </div>
    </div>
  </section>;
}
