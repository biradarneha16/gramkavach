import twilio from "twilio";

const PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;

export default async function handler(request: any, response: any) {
  if (request.method !== "POST") {
    response.status(405).json({ note: "Only POST requests are allowed." });
    return;
  }

  const { message, phone } = request.body ?? {};
  if (typeof message !== "string" || typeof phone !== "string" || !message.trim() || !PHONE_PATTERN.test(phone)) {
    response.status(400).json({ note: "Both phone and message are required." });
    return;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    response.status(200).json({
      note: "Twilio environment variables are missing. The prototype kept the alert in simulation mode."
    });
    return;
  }

  const smsClient = twilio(accountSid, authToken);
  try {
    const result = await smsClient.messages.create({
      body: message.slice(0, 480),
      from: fromNumber,
      to: phone
    });

    response.status(200).json({
      note: `SMS accepted by Twilio with SID ${result.sid}.`
    });
  } catch {
    response.status(502).json({ note: "SMS provider rejected the alert." });
  }
}
