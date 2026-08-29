export type DeliveryMode = "server-api" | "device-sms-bridge" | "queued-offline";
export type AlertStatus = "pending" | "verified" | "blocked" | "escalated";
export type AttemptType = "account-access" | "bank-link" | "device-login";
export type VerificationDecision = "authorised" | "fraud" | "unsure";
export type SignStatus = "right-sign" | "wrong-sign" | "pending";
export type NetworkMode = "online" | "offline";

export interface FaceCapture {
  fileName: string;
  previewUrl: string;
  capturedAt: string;
}

export interface ResidentProfile {
  fullName: string;
  phone: string;
  aadhaarId: string;
  village: string;
  bankAlias: string;
  guardianPin: string;
  trustedDevice: string;
  emergencyContact: string;
  cyberCrimeNumber: string;
  offlineSmsBridge: boolean;
  faceCapture: FaceCapture | null;
}

export interface AlertVerification {
  decision: VerificationDecision;
  signStatus: SignStatus;
  pinValidated: boolean;
  note: string;
  reviewedAt: string | null;
}

export interface SecurityEvent {
  id: string;
  title: string;
  source: string;
  location: string;
  timestamp: string;
  attemptType: AttemptType;
  severity: "high" | "critical";
  networkMode: NetworkMode;
  deliveryMode: DeliveryMode;
  status: AlertStatus;
  smsNote: string;
  verification: AlertVerification;
}

export interface VerificationPayload {
  decision: VerificationDecision;
  signStatus: SignStatus;
  guardianPinAttempt: string;
  note: string;
}
