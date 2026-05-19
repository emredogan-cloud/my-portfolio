import {
  isPerceptionCategory,
  isValidBucket,
  type PerceptionCategory,
} from "@/lib/v5/perception/buckets";
import {
  hasGrantedConsent,
  isPerceptionEnabled,
} from "@/lib/v5/perception/consent";
import { recordPerceptionEvent } from "@/lib/v5/perception/telemetry";

/**
 * V5 Phase 6 Sub-PR 6.1 — perception event endpoint.
 *
 * The single edge POST surface for the entire perception layer.
 * Phase 6.2+ observers fire `{ category, bucket }` here when a
 * perception signal crystallises; this endpoint validates, gates,
 * and increments a single KV hash field.
 *
 * Gate hierarchy (V5 § 4.1):
 *
 *   1. Env master switch: V5_PERCEPTION_ENABLED must equal "1".
 *      Without it, the endpoint silently no-ops every event.
 *      The operator can dark-launch the whole layer by leaving
 *      the var unset.
 *
 *   2. Category + bucket allow-list. Unknown categories drop.
 *      Unknown buckets drop. The endpoint never writes a
 *      free-form value into KV; every persisted bucket is a
 *      schema-validated label.
 *
 *   3. Consent gate. Non-adoption events require the inbound
 *      Cookie header to carry v5_perception_consent=granted.
 *      Adoption events (opt-in / revoke / deny) bypass this
 *      gate because they ARE the consent decision — recording
 *      the decision cannot itself require prior consent.
 *
 * Always returns 204 No Content. The endpoint is decorative;
 * a misbehaving client never blows up the page with a CORS /
 * 4xx pill. Validation failures are observable only as the
 * absence of the corresponding KV increment.
 *
 * What this endpoint does NOT do:
 *   - It does NOT read the visitor's IP, User-Agent, or any
 *     forwarded header beyond Cookie. The V5 § 4.1 "no
 *     fingerprinting, no per-user identifier" mandate is
 *     enforced architecturally — the request body is the only
 *     identifying surface, and it carries only category + bucket.
 *   - It does NOT issue or modify the consent cookie. Cookie
 *     management lives client-side in `lib/v5/perception/consent`.
 *     The endpoint only READS the cookie.
 *   - It does NOT accept GET. Prevents a malicious link prefetch
 *     from registering a consent event.
 */

export const runtime = "edge";

interface EventPayload {
  category?: unknown;
  bucket?: unknown;
}

function noContent() {
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(req: Request) {
  /* Gate 1: env master switch. If the operator hasn't turned the
   * layer on, every event drops at the door — no KV write, no
   * read of cookie, no validation effort. */
  if (!isPerceptionEnabled()) {
    return noContent();
  }

  /* Parse body. Failure = silent 204; we don't help a misbehaving
   * client by describing why. */
  let body: EventPayload;
  try {
    body = (await req.json()) as EventPayload;
  } catch {
    return noContent();
  }

  /* Gate 2: category + bucket allow-list. Both schema-defined in
   * `lib/v5/perception/buckets`. */
  if (!isPerceptionCategory(body.category)) {
    return noContent();
  }
  const category: PerceptionCategory = body.category;
  if (!isValidBucket(category, body.bucket)) {
    return noContent();
  }
  const bucket = body.bucket as string;

  /* Gate 3: consent. Adoption events (opt-in / revoke / deny)
   * bypass — they ARE the consent decision being recorded. */
  if (category !== "adoption") {
    const cookieHeader = req.headers.get("cookie");
    if (!hasGrantedConsent(cookieHeader)) {
      return noContent();
    }
  }

  /* Fire-and-forget HINCRBY. The helper itself swallows every
   * error path so this `void` never throws. */
  void recordPerceptionEvent(category, bucket);

  return noContent();
}

export function GET() {
  return new Response(null, {
    status: 405,
    headers: { Allow: "POST", "Cache-Control": "no-store" },
  });
}
