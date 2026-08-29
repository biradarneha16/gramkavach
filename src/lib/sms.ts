import {
  buildCyberCrimeMessage,
  buildUserAlertMessage
} from "./security";
import type { DeliveryMode, ResidentProfile, SecurityEvent } from "../types";

interface DispatchResult {
  ok: boolean;
  mode: DeliveryMode;
  note: string;
}

export async function notifyPrimaryUser(input: {
  event: SecurityEvent;
  isOnline: boolean;
  offlineBridgeEnabled: boolean;
  profile: ResidentProfile;
}): Promise<DispatchResult> {
  const message = buildUserAlertMessage(input.profile, input.event);

  if (!input.isOnline) {
    if (input.offlineBridgeEnabled && typeof window !== "undefined" && window.AndroidSmsBridge) {
      const bridgeResponse = window.AndroidSmsBridge.sendSms(input.profile.phone, message);

      return {
        ok: bridgeResponse?.ok ?? true,
        mode: "device-sms-bridge",
        note: "Offline SMS passed to the Android device bridge."
      };
    }

    return {
      ok: false,
      mode: "queued-offline",
      note: "No internet detected. Alert stored locally until connectivity returns or a native SMS bridge is added."
    };
  }

  try {
    const response = await fetch("/api/send-alert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        phone: input.profile.phone,
        message
      })
    });

    const payload = await response.json();
    return {
      ok: response.ok,
      mode: "server-api",
      note: payload.note ?? (response.ok ? "SMS notification sent to the registered phone." : "SMS delivery failed.")
    };
  } catch (error) {
    return {
      ok: false,
      mode: "queued-offline",
      note: error instanceof Error
        ? `Dispatch failed. Alert queued for retry: ${error.message}`
        : "Dispatch failed. Alert queued for retry."
    };
  }
}

export async function notifyCyberCrime(input: {
  event: SecurityEvent;
  isOnline: boolean;
  offlineBridgeEnabled: boolean;
  profile: ResidentProfile;
}): Promise<DispatchResult> {
  const message = buildCyberCrimeMessage(input.profile, input.event);
  const targetPhone = input.profile.cyberCrimeNumber;

  if (!targetPhone.trim()) {
    return {
      ok: false,
      mode: input.isOnline ? "server-api" : "queued-offline",
      note: "Cyber crime escalation skipped because no destination number is configured."
    };
  }

  if (!input.isOnline) {
    if (input.offlineBridgeEnabled && typeof window !== "undefined" && window.AndroidSmsBridge) {
      window.AndroidSmsBridge.sendSms(targetPhone, message);
      return {
        ok: true,
        mode: "device-sms-bridge",
        note: "Cyber crime escalation handed to the offline Android SMS bridge."
      };
    }

    return {
      ok: false,
      mode: "queued-offline",
      note: "Cyber crime escalation queued because the device is offline."
    };
  }

  try {
    const response = await fetch("/api/escalate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        phone: targetPhone,
        message
      })
    });

    const payload = await response.json();
    return {
      ok: response.ok,
      mode: "server-api",
      note: payload.note ?? (response.ok ? "Cyber crime branch notified." : "Cyber crime escalation failed.")
    };
  } catch (error) {
    return {
      ok: false,
      mode: "queued-offline",
      note: error instanceof Error
        ? `Cyber crime escalation queued for retry: ${error.message}`
        : "Cyber crime escalation queued for retry."
    };
  }
}
