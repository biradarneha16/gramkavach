import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { AlertModal } from "./components/AlertModal";
import { ProtectionDashboard } from "./components/ProtectionDashboard";
import { RegistrationForm } from "./components/RegistrationForm";
import { ThreatSimulator } from "./components/ThreatSimulator";
import {
  alertTone,
  blockedAlertCount,
  createSecurityEvent,
  formatTimestamp,
  hasEscalationThreshold,
  preferredDeliveryMode,
  protectionScore
} from "./lib/security";
import { notifyCyberCrime, notifyPrimaryUser } from "./lib/sms";
import { STORAGE_KEYS } from "./lib/storage";
import { supabase } from "./lib/supabase";
import { useLocalState } from "./hooks/useLocalState";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import type {
  AttemptType,
  ResidentProfile,
  SecurityEvent,
  VerificationPayload
} from "./types";

const defaultProfile: ResidentProfile = {
  fullName: "Rural citizen demo",
  phone: "+91 9876543210",
  aadhaarId: "1234 5678 9012",
  village: "Bhimtal Gram Panchayat",
  bankAlias: "Primary Jan Dhan account",
  guardianPin: "2406",
  trustedDevice: "Family Android handset",
  emergencyContact: "+91 9876500000",
  cyberCrimeNumber: "+91 1930",
  offlineSmsBridge: false,
  faceCapture: null
};

function updateFaceCapture(file: File, onDone: (value: ResidentProfile["faceCapture"]) => void) {
  const reader = new FileReader();
  reader.onload = () => {
    onDone({
      fileName: file.name,
      previewUrl: typeof reader.result === "string" ? reader.result : "",
      capturedAt: new Date().toISOString()
    });
  };
  reader.readAsDataURL(file);
}

export default function App() {
  const [profile, setProfile] = useLocalState(STORAGE_KEYS.profile, defaultProfile);
  const [events, setEvents] = useLocalState<SecurityEvent[]>(STORAGE_KEYS.events, []);
  const [offlineDemoMode, setOfflineDemoMode] = useLocalState(STORAGE_KEYS.offlineDemoMode, false);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [snoozedEventIds, setSnoozedEventIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const network = useNetworkStatus();
  const effectiveOnline = network.isOnline && !offlineDemoMode;
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const activeEvent = events.find((event) => event.id === activeEventId) ?? null;
  const pendingEvents = events.filter((event) => event.status === "pending");
  const queuedEvents = events.filter((event) => event.deliveryMode === "queued-offline" && event.status === "pending");
  const visibleEvents = events.filter((event) => {
    const query = deferredSearchTerm.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return [event.title, event.location, event.source, event.status]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  useEffect(() => {
    if (activeEventId) {
      return;
    }

    const nextEvent = pendingEvents.find((event) => !snoozedEventIds.includes(event.id));
    if (!nextEvent) {
      return;
    }

    setActiveEventId(nextEvent.id);
  }, [activeEventId, pendingEvents, snoozedEventIds]);

  useEffect(() => {
    if (!effectiveOnline || !queuedEvents.length) {
      return;
    }

    queuedEvents.forEach((queuedEvent) => {
      setEvents((currentEvents) =>
        currentEvents.map((candidate) =>
          candidate.id === queuedEvent.id
            ? {
                ...candidate,
                deliveryMode: "server-api",
                networkMode: "online",
                smsNote: "Connection restored. Replaying queued SMS now."
              }
            : candidate
        )
      );

      void notifyPrimaryUser({
        event: queuedEvent,
        isOnline: true,
        offlineBridgeEnabled: profile.offlineSmsBridge,
        profile
      }).then((result) => {
        setEvents((currentEvents) =>
          currentEvents.map((candidate) =>
            candidate.id === queuedEvent.id
              ? {
                  ...candidate,
                  deliveryMode: result.mode,
                  networkMode: "online",
                  smsNote: result.note
                }
              : candidate
          )
        );
      });
    });
  }, [effectiveOnline, profile, queuedEvents, setEvents]);

  function updateProfile<K extends keyof ResidentProfile>(field: K, value: ResidentProfile[K]) {
    setProfile((currentProfile) => ({
      ...currentProfile,
      [field]: value
    }));
  }

  function handleFaceCapture(file: File | null) {
    if (!file) {
      updateProfile("faceCapture", null);
      return;
    }

    updateFaceCapture(file, (faceCapture) => {
      updateProfile("faceCapture", faceCapture);
    });
  }

  async function dispatchPrimaryNotification(event: SecurityEvent) {
    const result = await notifyPrimaryUser({
      event,
      isOnline: effectiveOnline,
      offlineBridgeEnabled: profile.offlineSmsBridge,
      profile
    });

    setEvents((currentEvents) =>
      currentEvents.map((candidate) =>
        candidate.id === event.id
          ? {
              ...candidate,
              deliveryMode: result.mode,
              smsNote: result.note
            }
          : candidate
      )
    );
  }

  function simulateAlert(attemptType: AttemptType) {
    const event = createSecurityEvent({
      attemptType,
      deliveryMode: preferredDeliveryMode(effectiveOnline, profile.offlineSmsBridge),
      location: profile.village || "Unknown location",
      networkMode: effectiveOnline ? "online" : "offline"
    });

    startTransition(() => {
      setSnoozedEventIds((currentIds) => currentIds.filter((candidate) => candidate !== event.id));
      setEvents((currentEvents) => [event, ...currentEvents]);
      setActiveEventId(event.id);
    });

    void dispatchPrimaryNotification(event);
  }

  async function resolveAlert(payload: VerificationPayload) {
    if (!activeEvent) {
      return;
    }

    const pinValidated = payload.guardianPinAttempt === profile.guardianPin;
    const isFraudDecision = payload.decision === "fraud" || payload.signStatus === "wrong-sign" || !pinValidated;
    const resolvedStatus = isFraudDecision ? "blocked" : "verified";

    const resolvedEvent: SecurityEvent = {
      ...activeEvent,
      status: resolvedStatus,
      verification: {
        decision: payload.decision,
        signStatus: payload.signStatus,
        pinValidated,
        note: payload.note,
        reviewedAt: new Date().toISOString()
      },
      smsNote: isFraudDecision
        ? "Citizen marked this event as risky. Protection remains active."
        : "Citizen verified this event through the three-step flow."
    };

    const nextEvents = events.map((candidate) =>
      candidate.id === resolvedEvent.id ? resolvedEvent : candidate
    );

    setSnoozedEventIds((currentIds) => currentIds.filter((candidate) => candidate !== resolvedEvent.id));
    setActiveEventId(null);

    if (resolvedStatus === "blocked" && hasEscalationThreshold(nextEvents)) {
      const escalatedEvent: SecurityEvent = {
        ...resolvedEvent,
        status: "escalated",
        smsNote: "More than three alerts detected. Escalating to the cyber crime branch."
      };

      setEvents(
        nextEvents.map((candidate) =>
          candidate.id === escalatedEvent.id ? escalatedEvent : candidate
        )
      );

      const escalationResult = await notifyCyberCrime({
        event: escalatedEvent,
        isOnline: effectiveOnline,
        offlineBridgeEnabled: profile.offlineSmsBridge,
        profile
      });

      setEvents((currentEvents) =>
        currentEvents.map((candidate) =>
          candidate.id === escalatedEvent.id
            ? {
                ...candidate,
                deliveryMode: escalationResult.mode,
                smsNote: escalationResult.note
              }
            : candidate
        )
      );
    } else {
      setEvents(nextEvents);
    }
  }

  return (
    <div className="app-shell">
      <header className="topline">
        <p>Citizen safety prototype for suspicious bank access detection, registration, and emergency escalation.</p>
      </header>

      <main className="layout">
        <ProtectionDashboard
          blockedCount={blockedAlertCount(events)}
          effectiveOnline={effectiveOnline}
          offlineDemoMode={offlineDemoMode}
          pendingCount={pendingEvents.length}
          protectionScore={protectionScore(profile, events)}
          queuedCount={queuedEvents.length}
          setOfflineDemoMode={setOfflineDemoMode}
          supabaseReady={Boolean(supabase)}
        />

        <section className="split-shell">
          <RegistrationForm
            profile={profile}
            onFaceCapture={handleFaceCapture}
            onFieldChange={updateProfile}
          />

          <section className="panel section-stack">
            <div className="section-heading">
              <span className="eyebrow">Security Principles</span>
              <h2>Build this as a hard target, but stay honest about what the web alone cannot do.</h2>
            </div>

            <div className="principle-list">
              <article>
                <strong>Instant pop-up first</strong>
                <p>Every access or bank-link attempt opens the alert modal immediately before the citizen decides whether it is safe.</p>
              </article>
              <article>
                <strong>SMS to registered phone</strong>
                <p>Online mode uses the server API. Offline mode needs an Android SMS bridge or a paired device with SIM permissions.</p>
              </article>
              <article>
                <strong>Three-step verification</strong>
                <p>Authorised or fraud decision, right-or-wrong sign selection, and guardian PIN confirmation work together before the event is cleared.</p>
              </article>
              <article>
                <strong>Escalation after repeated alerts</strong>
                <p>Once blocked alerts go above three, GRAMKAVACH escalates the latest incident to the configured cyber crime branch number.</p>
              </article>
            </div>
          </section>
        </section>

        <ThreatSimulator effectiveOnline={effectiveOnline} onSimulate={simulateAlert} />

        <section className="panel event-shell">
          <div className="section-heading">
            <span className="eyebrow">Alert Ledger</span>
            <h2>Track every attempt, verification result, and fallback route.</h2>
          </div>

          <div className="ledger-toolbar">
            <label className="field compact-field">
              <span>Search alerts</span>
              <input
                placeholder="Search by event, location, source, or status"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
            <p>
              Prototype note: browser apps cannot independently watch real bank accounts or send offline SMS. Production needs bank APIs plus a native Android wrapper or telecom gateway.
            </p>
          </div>

          <div className="ledger-list">
            {visibleEvents.length ? (
              visibleEvents.map((event) => (
                <article className={`ledger-item ${alertTone(event.status)}`} key={event.id}>
                  <div className="ledger-meta">
                    <span className="ledger-status">{event.status}</span>
                    <span>{formatTimestamp(event.timestamp)}</span>
                  </div>
                  <div className="ledger-main">
                    <div>
                      <h3>{event.title}</h3>
                      <p>{event.source}</p>
                    </div>
                    <div className="ledger-context">
                      <span>{event.location}</span>
                      <span>{event.deliveryMode}</span>
                    </div>
                  </div>
                  <p className="ledger-note">{event.smsNote}</p>
                  {event.verification.reviewedAt ? (
                    <p className="ledger-proof">
                      Decision: {event.verification.decision} | Sign: {event.verification.signStatus} | PIN valid: {event.verification.pinValidated ? "yes" : "no"}
                    </p>
                  ) : null}
                  {event.status === "pending" ? (
                    <button
                      className="ledger-action"
                      onClick={() => {
                        setSnoozedEventIds((currentIds) => currentIds.filter((candidate) => candidate !== event.id));
                        setActiveEventId(event.id);
                      }}
                      type="button"
                    >
                      Open pending alert
                    </button>
                  ) : null}
                </article>
              ))
            ) : (
              <div className="empty-state">
                <h3>No alerts yet</h3>
                <p>Trigger a suspicious access event above to test the live pop-up, SMS path, and escalation rule.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <AlertModal
        event={activeEvent}
        onClose={() => {
          if (activeEvent) {
            setSnoozedEventIds((currentIds) => (
              currentIds.includes(activeEvent.id) ? currentIds : [...currentIds, activeEvent.id]
            ));
          }
          setActiveEventId(null);
        }}
        onResolve={resolveAlert}
        profile={profile}
      />
    </div>
  );
}
