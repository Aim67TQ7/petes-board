import type { Handler, HandlerEvent } from "@netlify/functions";

// Security configuration
const CODEWORD = "BEDFORD";
const ALLOWED_NUMBERS = [
  // Add Mr. Clausing's number here (will need to be provided)
  // Format: "+1XXXXXXXXXX"
];

// Supabase config
const SUPABASE_URL = "https://ezlmmegowggujpcnzoda.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

// Interface for Twilio message payload (for reference)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface TwilioMessage {
  From: string;
  To: string;
  Body: string;
  MessageSid: string;
}

// Log SMS to audit table
async function logSmsAudit(from: string, body: string, status: string, action: string) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/sms_audit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        from_number: from,
        message_body: body,
        status,
        action_taken: action,
        created_at: new Date().toISOString()
      })
    });
  } catch (e) {
    console.error("Failed to log SMS audit:", e);
  }
}

// Post message to Pete's Board
async function postToBoard(from: string, content: string) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        sender: "user",
        content: `[SMS from ${from}] ${content}`
      })
    });
  } catch (e) {
    console.error("Failed to post to board:", e);
  }
}

// Generate TwiML response
function twimlResponse(message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${message}</Message>
</Response>`;
}

export const handler: Handler = async (event: HandlerEvent) => {
  // Parse Twilio webhook data
  const params = new URLSearchParams(event.body || "");
  const from = params.get("From") || "";
  const body = params.get("Body") || "";
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const messageSid = params.get("MessageSid") || ""; // Reserved for future audit logging

  console.log(`SMS received from ${from}: ${body.substring(0, 50)}...`);

  // Layer 1: Check allowlist (if configured)
  if (ALLOWED_NUMBERS.length > 0 && !ALLOWED_NUMBERS.includes(from)) {
    await logSmsAudit(from, body, "rejected", "unauthorized_number");
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/xml" },
      body: twimlResponse("This number is not authorized to contact Pete.")
    };
  }

  // Layer 2: Check codeword
  const words = body.trim().split(/\s+/);
  const firstWord = words[0]?.toUpperCase();
  
  if (firstWord !== CODEWORD) {
    await logSmsAudit(from, body, "rejected", "invalid_codeword");
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/xml" },
      body: twimlResponse("Authentication required. Start your message with the code word.")
    };
  }

  // Remove codeword from message
  const actualMessage = words.slice(1).join(" ");

  if (!actualMessage) {
    await logSmsAudit(from, body, "rejected", "empty_message");
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/xml" },
      body: twimlResponse("Code accepted. What can I help you with?")
    };
  }

  // Layer 3: Command restrictions (SMS = read-only, post to board only)
  // All authenticated messages go to Pete's Board for processing
  await postToBoard(from, actualMessage);
  await logSmsAudit(from, body, "accepted", "posted_to_board");

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/xml" },
    body: twimlResponse("Got it. Message posted to Pete's Board.")
  };
};
