import { ShieldLogo } from "./ShieldLogo";

interface ProtectionDashboardProps {
  blockedCount: number;
  effectiveOnline: boolean;
  pendingCount: number;
  protectionScore: number;
  queuedCount: number;
  setOfflineDemoMode: (value: boolean) => void;
  supabaseReady: boolean;
  offlineDemoMode: boolean;
  onLogout: () => void;
}

export function ProtectionDashboard({
  blockedCount,
  effectiveOnline,
  offlineDemoMode,
  pendingCount,
  protectionScore,
  queuedCount,
  setOfflineDemoMode,
  supabaseReady,
  onLogout
}: ProtectionDashboardProps) {
  return (
    <section className="panel dashboard-shell">
      <div className="dashboard-hero">
        <div className="brand-block">
          <div className="brand-mark">
            <ShieldLogo />
          </div>
          <div>
            <span className="eyebrow">Protection Command Center</span>
            <h1>GRAMKAVACH</h1>
            <p>
              Instant pop-up alerts, registered-phone SMS, and escalation logic for suspicious account access.
            </p>
          </div>
          <button className="logout-button" onClick={onLogout} type="button">Log out</button>
        </div>

        <div className="hero-metrics">
          <div>
            <span>Protection score</span>
            <strong>{protectionScore}%</strong>
          </div>
          <div>
            <span>Connection</span>
            <strong>{effectiveOnline ? "Online" : "Offline fallback"}</strong>
          </div>
        </div>
      </div>

      <div className="metric-strip">
        <article>
          <span>Pending alerts</span>
          <strong>{pendingCount}</strong>
        </article>
        <article>
          <span>Blocked attempts</span>
          <strong>{blockedCount}</strong>
        </article>
        <article>
          <span>Queued offline SMS</span>
          <strong>{queuedCount}</strong>
        </article>
        <article>
          <span>Sync target</span>
          <strong>{supabaseReady ? "Supabase ready" : "Local prototype mode"}</strong>
        </article>
      </div>

      <div className="dashboard-controls">
        <label className="toggle-row">
          <input
            checked={offlineDemoMode}
            type="checkbox"
            onChange={(event) => setOfflineDemoMode(event.target.checked)}
          />
          <span>Force offline demo mode</span>
        </label>

        <div className={`status-chip ${effectiveOnline ? "status-live" : "status-offline"}`}>
          <span className="status-dot" />
          {effectiveOnline
            ? "Online alert API active"
            : "Offline mode active. Android bridge or queued retry path engaged."}
        </div>
      </div>
    </section>
  );
}
