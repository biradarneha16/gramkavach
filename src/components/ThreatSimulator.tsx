import { ATTEMPT_OPTIONS } from "../lib/security";
import type { AttemptType } from "../types";

interface ThreatSimulatorProps {
  effectiveOnline: boolean;
  onSimulate: (attemptType: AttemptType) => void;
}

export function ThreatSimulator({
  effectiveOnline,
  onSimulate
}: ThreatSimulatorProps) {
  return (
    <section className="panel section-stack">
      <div className="section-heading">
        <span className="eyebrow">Threat Simulator</span>
        <h2>Test the exact alert moments that matter for your project.</h2>
      </div>

      <div className="simulator-grid">
        {ATTEMPT_OPTIONS.map((option) => (
          <button
            key={option.id}
            className="simulator-button"
            onClick={() => onSimulate(option.id)}
            type="button"
          >
            <span>{option.label}</span>
            <strong>{option.source}</strong>
            <small>{effectiveOnline ? "Will notify the registered phone now" : "Will use offline fallback path"}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
