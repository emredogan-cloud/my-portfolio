"use server";

import { Resend } from "resend";

export interface ContactResult {
  ok: boolean;
  error?: string;
}

const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? "emre30283@gmail.com";

export async function sendContactEmail(
  _prev: ContactResult,
  formData: FormData,
): Promise<ContactResult> {
  // ── Extract + validate ─────────────────────────────────────
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const honeypot = String(formData.get("company") ?? "").trim();

  // Honeypot — silently succeed on bot submissions
  if (honeypot) return { ok: true };

  if (!name || name.length < 1 || name.length > 100) {
    return { ok: false, error: "Please provide your name." };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please provide a valid email address." };
  }
  if (!message || message.length < 10) {
    return { ok: false, error: "Message must be at least 10 characters." };
  }
  if (message.length > 4000) {
    return { ok: false, error: "Message must be under 4000 characters." };
  }

  // ── Config guard ───────────────────────────────────────────
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error:
        "Email service isn't configured yet. Reach me directly at emre30283@gmail.com.",
    };
  }

  // ── Send via Resend ────────────────────────────────────────
  try {
    const resend = new Resend(apiKey);

    const result = await resend.emails.send({
      from: "Portfolio Contact <onboarding@resend.dev>",
      to: [CONTACT_EMAIL],
      replyTo: email,
      subject: `New portfolio message from ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
      html: `
        <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111;">
          <p style="color:#666;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 12px;">Portfolio Contact</p>
          <h1 style="font-size:20px;font-weight:600;margin:0 0 24px;">New message from ${escapeHtml(name)}</h1>
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
            <tr><td style="padding:8px 0;color:#666;width:80px;">From</td><td style="padding:8px 0;">${escapeHtml(name)}</td></tr>
            <tr><td style="padding:8px 0;color:#666;">Email</td><td style="padding:8px 0;"><a href="mailto:${encodeURIComponent(email)}" style="color:#0066ff;">${escapeHtml(email)}</a></td></tr>
          </table>
          <div style="border-left:3px solid #eee;padding:12px 16px;background:#fafafa;border-radius:6px;">
            <p style="margin:0;white-space:pre-wrap;line-height:1.6;">${escapeHtml(message)}</p>
          </div>
        </div>
      `,
    });

    if (result.error) {
      return { ok: false, error: result.error.message ?? "Failed to send." };
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error.";
    return { ok: false, error: message };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
