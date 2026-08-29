import type {
  AlertStatus,
  AttemptType,
  DeliveryMode,
  NetworkMode,
  ResidentProfile,
  SecurityEvent
} from "../types";

export const VERIFY_STEPS = [
  "Instant pop-up alert on suspicious access",
  "Right or wrong sign confirmation",
  "Guardian PIN confirmation"
];

export const ATTEMPT_OPTIONS: Array<{
  id: AttemptType;
  label: string;
  source: string;
  severity: "high" | "critical";
}> = [
  {
    id: "account-access",
    label: "Suspicious account access",
    source: "Net banking access sensor",
    severity: "critical"
  },
  {
    id: "bank-link",
    label: "New bank account linking attempt",
    source: "Beneficiary link scanner",
    severity: "critical"
  },
  {
    id: "device-login",
    label: "Unknown device login attempt",
    source: "Trusted device watcher",
    severity: "high"
  }
];

export function createSecurityEvent(input: {
  attemptType: AttemptType;
  deliveryMode: DeliveryMode;
  location: string;
  networkMode: NetworkMode;
}): SecurityEvent {
  const option = ATTEMPT_OPTIONS.find((candidate) => candidate.id === input.attemptType);
  const eventId = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    id: eventId,
    title: option?.label ?? "Security alert",
    source: option?.source ?? "GRAMKAVACH protection engine",
    location: input.location,
    timestamp: new Date().toISOString(),
    attemptType: input.attemptType,
    severity: option?.severity ?? "high",
    networkMode: input.networkMode,
    deliveryMode: input.deliveryMode,
    status: "pending",
    smsNote: "Alert pop-up opened. Message dispatch in progress.",
    verification: {
      decision: "unsure",
      signStatus: "pending",
      pinValidated: false,
      note: "",
      reviewedAt: null
    }
  };
}

export function preferredDeliveryMode(
  isOnline: boolean,
  offlineBridgeEnabled: boolean
): DeliveryMode {
  if (isOnline) {
    return "server-api";
  }

  if (offlineBridgeEnabled && typeof window !== "undefined" && window.AndroidSmsBridge) {
    return "device-sms-bridge";
  }

  return "queued-offline";
}

export function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

export function protectionScore(profile: ResidentProfile, events: SecurityEvent[]) {
  let score = 46;

  if (profile.fullName.trim()) score += 6;
  if (profile.phone.trim()) score += 10;
  if (profile.aadhaarId.trim()) score += 8;
  if (profile.faceCapture) score += 12;
  if (profile.guardianPin.trim().length === 4) score += 8;
  if (profile.offlineSmsBridge) score += 6;

  const blockedEvents = events.filter((event) => event.status === "blocked" || event.status === "escalated").length;
  score -= Math.min(blockedEvents * 4, 20);

  return Math.max(12, Math.min(98, score));
}

export function buildUserAlertMessage(profile: ResidentProfile, event: SecurityEvent) {
  return [
    `GRAMKAVACH ALERT for ${profile.fullName || "registered user"}`,
    `${event.title} detected at ${formatTimestamp(event.timestamp)}`,
    `Source: ${event.source}`,
    `Location: ${event.location}`,
    "Open the app immediately to complete 3-step verification."
  ].join(" | ");
}

export function buildCyberCrimeMessage(profile: ResidentProfile, event: SecurityEvent) {
  return [
    "GRAMKAVACH escalation notice",
    `Repeated alerts detected for ${profile.fullName || "registered user"}`,
    `Latest event: ${event.title}`,
    `Village/Area: ${profile.village || "not provided"}`,
    `Registered phone: ${profile.phone || "not provided"}`
  ].join(" | ");
}

export function blockedAlertCount(events: SecurityEvent[]) {
  return events.filter((event) => event.status === "blocked" || event.status === "escalated").length;
}

export function hasEscalationThreshold(events: SecurityEvent[]) {
  return blockedAlertCount(events) > 3;
}

export function alertTone(status: AlertStatus) {
  if (status === "escalated") return "tone-critical";
  if (status === "blocked") return "tone-alert";
  if (status === "verified") return "tone-safe";
  return "tone-live";
}

export function attemptLabel(attemptType: AttemptType) {
  return ATTEMPT_OPTIONS.find((candidate) => candidate.id === attemptType)?.label ?? "Security alert";
}
