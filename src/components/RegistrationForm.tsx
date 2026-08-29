import type { ChangeEvent } from "react";
import type { ResidentProfile } from "../types";

interface RegistrationFormProps {
  profile: ResidentProfile;
  onFaceCapture: (file: File | null) => void;
  onFieldChange: <K extends keyof ResidentProfile>(field: K, value: ResidentProfile[K]) => void;
}

export function RegistrationForm({
  profile,
  onFaceCapture,
  onFieldChange
}: RegistrationFormProps) {
  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    onFaceCapture(event.target.files?.[0] ?? null);
  }

  return (
    <section className="panel section-stack">
      <div className="section-heading">
        <span className="eyebrow">Citizen Registration</span>
        <h2>Strong onboarding with the fields your core idea depends on.</h2>
      </div>

      <div className="form-grid">
        <label className="field">
          <span>Name</span>
          <input
            placeholder="Authorised citizen name"
            value={profile.fullName}
            onChange={(event) => onFieldChange("fullName", event.target.value)}
          />
        </label>

        <label className="field">
          <span>Registered phone</span>
          <input
            placeholder="+91 98XXXXXXXX"
            value={profile.phone}
            onChange={(event) => onFieldChange("phone", event.target.value)}
          />
        </label>

        <label className="field">
          <span>Aadhaar ID</span>
          <input
            autoComplete="off"
            inputMode="numeric"
            maxLength={14}
            placeholder="XXXX XXXX XXXX"
            type="password"
            value={profile.aadhaarId}
            onChange={(event) => onFieldChange("aadhaarId", event.target.value.replace(/[^\d ]/g, "").slice(0, 14))}
          />
        </label>

        <label className="field">
          <span>Village / Area</span>
          <input
            placeholder="Village, town, district"
            value={profile.village}
            onChange={(event) => onFieldChange("village", event.target.value)}
          />
        </label>

        <label className="field">
          <span>Bank alias</span>
          <input
            placeholder="Primary savings account"
            value={profile.bankAlias}
            onChange={(event) => onFieldChange("bankAlias", event.target.value)}
          />
        </label>

        <label className="field">
          <span>Trusted device</span>
          <input
            placeholder="Samsung M34 / family phone"
            value={profile.trustedDevice}
            onChange={(event) => onFieldChange("trustedDevice", event.target.value)}
          />
        </label>

        <label className="field">
          <span>Guardian PIN</span>
          <input
            inputMode="numeric"
            maxLength={4}
            placeholder="4-digit secure PIN"
            value={profile.guardianPin}
            onChange={(event) => onFieldChange("guardianPin", event.target.value.replace(/\D/g, "").slice(0, 4))}
          />
        </label>

        <label className="field">
          <span>Emergency contact</span>
          <input
            placeholder="+91 98XXXXXXXX"
            value={profile.emergencyContact}
            onChange={(event) => onFieldChange("emergencyContact", event.target.value)}
          />
        </label>

        <label className="field">
          <span>Cyber crime number</span>
          <input
            placeholder="+91 escalation contact"
            value={profile.cyberCrimeNumber}
            onChange={(event) => onFieldChange("cyberCrimeNumber", event.target.value)}
          />
        </label>
      </div>

      <div className="capture-strip">
        <label className="capture-box">
          <span className="capture-label">Face detection capture</span>
          <input type="file" accept="image/*" capture="user" onChange={handleFileChange} />
          <strong>{profile.faceCapture ? "Face template stored" : "Take selfie / upload image"}</strong>
          <small>
            Demo only: the image is stored locally. Production must use consented encrypted biometric storage and an approved identity provider.
          </small>
        </label>

        <label className="toggle-row">
          <input
            checked={profile.offlineSmsBridge}
            type="checkbox"
            onChange={(event) => onFieldChange("offlineSmsBridge", event.target.checked)}
          />
          <span>Enable Android offline SMS bridge mode</span>
        </label>
      </div>

      {profile.faceCapture ? (
        <div className="capture-preview">
          <img alt="Registered face capture" src={profile.faceCapture.previewUrl} />
          <div>
            <strong>{profile.faceCapture.fileName}</strong>
            <p>Captured {new Date(profile.faceCapture.capturedAt).toLocaleString("en-IN")}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
