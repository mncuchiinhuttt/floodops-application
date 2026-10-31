import { useState, type KeyboardEvent } from "react";
import { Check } from "lucide-react";
import { ROLES } from "./landing-copy";
import { revealDelay } from "./use-reveal";

export function RolesSection() {
  const [selected, setSelected] = useState(0);
  const role = ROLES[selected] ?? ROLES[0]!;
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const step = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (selected + step + ROLES.length) % ROLES.length;
    setSelected(next);
    document.getElementById(`role-tab-${ROLES[next]!.id}`)?.focus();
  }
  return <section id="vai-tro" className="landing-section" aria-labelledby="roles-title">
    <div className="landing-container">
      <h2 id="roles-title" className="section-title" data-reveal>Mỗi vai trò, một góc nhìn</h2>
      <p className="section-lede" data-reveal style={revealDelay(60)}>Quyền được cấp từ server theo từng phiên, không dựa vào lựa chọn của giao diện.</p>
      <div className="roles-layout" data-reveal style={revealDelay(100)}>
        <div role="tablist" aria-orientation="vertical" aria-label="Vai trò trong phiên" className="roles-tabs">
          {ROLES.map((item, index) => <button key={item.id} type="button" role="tab" id={`role-tab-${item.id}`} aria-selected={index === selected} aria-controls="role-panel"
            tabIndex={index === selected ? 0 : -1} onClick={() => setSelected(index)} onKeyDown={onKeyDown}><item.icon size={20} strokeWidth={1.75} aria-hidden="true" />{item.name}</button>)}
        </div>
        <div role="tabpanel" id="role-panel" aria-labelledby={`role-tab-${role.id}`} className="roles-panel" key={role.id}>
          <h3>{role.name}</h3>
          <p>{role.summary}</p>
          <ul>{role.abilities.map(ability => <li key={ability}><Check size={18} strokeWidth={2} aria-hidden="true" />{ability}</li>)}</ul>
        </div>
      </div>
    </div>
  </section>;
}
