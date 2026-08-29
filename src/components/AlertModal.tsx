import { useEffect, useState } from "react";
import { VERIFY_STEPS, formatTimestamp } from "../lib/security";
import type {
  ResidentProfile,
  SecurityEvent,
  SignStatus,
  VerificationDecision,
  VerificationPayload
} from "../types";

interface AlertModalProps {
  event: SecurityEvent | null;
  profile: ResidentProfile;
  onClose: () => void;
  onResolve: (payload: VerificationPayload) => void;
}

export function AlertModal({
  event,
  profile,
  onClose,
  onResolve
}: AlertModalProps) {
  const [decision, setDecision] = useState<VerificationDecision>("unsure");
  const [signStatus, setSignStatus] = useState<SignStatus>("pending");
  const [guardianPinAttempt, setGuardianPinAttempt] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    setDecision("unsure");
    setSignStatus("pending");
    setGuardianPinAttempt("");
    setNote("");
  }, [event?.id]);

  if (!event) {
    return null;
  }

  const canSubmit = decision !== "unsure" && signStatus !== "pending" && guardianPinAttempt.length === 4;

  return (
    <div className="alert-overlay" role="presentation">
      <section aria-modal="true" className="alert-modal" role="dialog">
        <div className="alert-head">
          <span className="eyebrow alert-eyebrow">Live Alert</span>
          <h2>{event.title}</h2>
          <p>
            Registered phone: {profile.phone || "missing"}
            <span>Raised {formatTimestamp(event.timestamp)}</span>
          </p>
        </div>

        <div className="alert-context">
          <div>
            <span>Source</span>
            <strong>{event.source}</strong>
          </div>
          <div>
            <span>Location</span>
            <strong>{event.location}</strong>
          </div>
          <div>
            <span>Delivery mode</span>
            <strong>{event.deliveryMode}</strong>
          </div>
        </div>

        <ol className="verify-steps">
          {VERIFY_STEPS.map((step, index) => (
            <li key={step}>
              <span>{index + 1}</span>
              <p>{step}</p>
            </li>
          ))}
        </ol>

        <form
          className="verify-form"
          onSubmit={(submitEvent) => {
            submitEvent.preventDefault();
            onResolve({
              decision,
              signStatus,
              guardianPinAttempt,
              note
            });
          }}
        >
          <fieldset className="decision-group">
            <legend>Step 1. Is this access attempt authorised?</legend>
            <div className="decision-row">
              <button
                className={decision === "authorised" ? "choice active" : "choice"}
                onClick={() => setDecision("authorised")}
                type="button"
              >
                This is me
              </button>
              <button
                className={decision === "fraud" ? "choice active danger" : "choice danger"}
                onClick={() => setDecision("fraud")}
                type="button"
              >
                This is fraud
              </button>
            </div>
          </fieldset>

          <fieldset className="decision-group">
            <legend>Step 2. Pick the right or wrong sign.</legend>
            <div className="decision-row">
              <button
                className={signStatus === "right-sign" ? "choice active" : "choice"}
                onClick={() => setSignStatus("right-sign")}
                type="button"
              >
                Right sign
              </button>
              <button
                className={signStatus === "wrong-sign" ? "choice active danger" : "choice danger"}
                onClick={() => setSignStatus("wrong-sign")}
                type="button"
              >
                Wrong sign
              </button>
            </div>
          </fieldset>

          <label className="field">
            <span>Step 3. Guardian PIN</span>
            <input
              inputMode="numeric"
              maxLength={4}
              placeholder="Enter 4-digit PIN"
              value={guardianPinAttempt}
              onChange={(inputEvent) => setGuardianPinAttempt(inputEvent.target.value.replace(/\D/g, "").slice(0, 4))}
            />
          </label>

          <label className="field">
            <span>Verification note</span>
            <textarea
              placeholder="Optional note for investigation or family alert"
              rows={3}
              value={note}
              onChange={(inputEvent) => setNote(inputEvent.target.value)}
            />
          </label>

          <div className="modal-actions">
            <button className="ghost-button" onClick={onClose} type="button">
              Review later
            </button>
            <button className="primary-button" disabled={!canSubmit} type="submit">
              Complete 3-step verification
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
