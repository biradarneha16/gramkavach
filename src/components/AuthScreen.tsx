import { useState, type ChangeEvent, type FormEvent } from "react";
import type { ResidentProfile } from "../types";

interface AuthScreenProps {
  onLogin: (phone: string, pin: string) => string | null;
  onRegister: (profile: ResidentProfile) => string | null;
}

const emptyProfile: ResidentProfile = {
  fullName: "",
  phone: "",
  aadhaarId: "",
  village: "",
  bankAlias: "Primary bank account",
  guardianPin: "",
  trustedDevice: "This device",
  emergencyContact: "",
  cyberCrimeNumber: "+91 1930",
  offlineSmsBridge: false,
  faceCapture: null
};

function normalizePhone(value: string) {
  return value.replace(/[\s-]/g, "");
}

export function AuthScreen({ onLogin, onRegister }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [profile, setProfile] = useState(emptyProfile);
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPin, setLoginPin] = useState("");
  const [error, setError] = useState("");

  function updateProfile<K extends keyof ResidentProfile>(field: K, value: ResidentProfile[K]) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function handleFaceCapture(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      updateProfile("faceCapture", {
        fileName: file.name,
        previewUrl: typeof reader.result === "string" ? reader.result : "",
        capturedAt: new Date().toISOString()
      });
    };
    reader.readAsDataURL(file);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (mode === "login") {
      const loginError = onLogin(normalizePhone(loginPhone), loginPin);
      if (loginError) setError(loginError);
      return;
    }

    const digits = profile.aadhaarId.replace(/\D/g, "");
    if (!profile.fullName.trim() || !profile.phone.trim() || digits.length !== 12 || profile.guardianPin.length !== 4 || !profile.faceCapture) {
      setError("Enter your name, valid phone, 12-digit Aadhaar, 4-digit PIN, and selfie capture.");
      return;
    }

    const registrationError = onRegister({
      ...profile,
      phone: normalizePhone(profile.phone),
      aadhaarId: digits
    });
    if (registrationError) setError(registrationError);
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="auth-shield">GK</div>
          <div>
            <span className="eyebrow">GRAMKAVACH</span>
            <p>Bank access protection</p>
          </div>
        </div>

        <div className="auth-heading">
          <span className="eyebrow">Secure entry</span>
          <h1>{mode === "register" ? "Protect your account from the first alert." : "Welcome back to your protection center."}</h1>
          <p>{mode === "register" ? "Register once. Every suspicious access attempt will appear here first." : "Sign in to review recent access, linking, and device alerts."}</p>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Account access">
          <button className={mode === "register" ? "auth-tab active" : "auth-tab"} onClick={() => { setMode("register"); setError(""); }} type="button">Register</button>
          <button className={mode === "login" ? "auth-tab active" : "auth-tab"} onClick={() => { setMode("login"); setError(""); }} type="button">Login</button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {mode === "register" ? (
            <>
              <label className="field"><span>Full name</span><input autoComplete="name" placeholder="Authorised user's name" value={profile.fullName} onChange={(event) => updateProfile("fullName", event.target.value)} /></label>
              <label className="field"><span>Registered mobile number</span><input autoComplete="tel" inputMode="tel" placeholder="+91 98XXXXXXXX" value={profile.phone} onChange={(event) => updateProfile("phone", event.target.value)} /></label>
              <label className="field"><span>Aadhaar number</span><input autoComplete="off" inputMode="numeric" maxLength={12} placeholder="12-digit Aadhaar" type="password" value={profile.aadhaarId} onChange={(event) => updateProfile("aadhaarId", event.target.value.replace(/\D/g, "").slice(0, 12))} /></label>
              <label className="field"><span>Guardian PIN</span><input autoComplete="new-password" inputMode="numeric" maxLength={4} placeholder="Create 4-digit PIN" type="password" value={profile.guardianPin} onChange={(event) => updateProfile("guardianPin", event.target.value.replace(/\D/g, "").slice(0, 4))} /></label>
              <label className="capture-box auth-capture"><span className="capture-label">Face detection / selfie capture</span><input accept="image/*" capture="user" type="file" onChange={handleFaceCapture} /><strong>{profile.faceCapture ? "Selfie captured" : "Capture your face"}</strong><small>Prototype capture for identity enrollment. Use a production biometric provider before handling real bank accounts.</small></label>
            </>
          ) : (
            <>
              <label className="field"><span>Registered mobile number</span><input autoComplete="tel" inputMode="tel" placeholder="+91 98XXXXXXXX" value={loginPhone} onChange={(event) => setLoginPhone(event.target.value)} /></label>
              <label className="field"><span>Guardian PIN</span><input autoComplete="current-password" inputMode="numeric" maxLength={4} placeholder="4-digit PIN" type="password" value={loginPin} onChange={(event) => setLoginPin(event.target.value.replace(/\D/g, "").slice(0, 4))} /></label>
            </>
          )}

          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="primary-button auth-submit" type="submit">{mode === "register" ? "Create protection profile" : "Open protection center"}</button>
        </form>

        <div className="auth-flow"><span>01 Register</span><span>02 Alert appears</span><span>03 Verify and respond</span></div>
      </section>
    </main>
  );
}
