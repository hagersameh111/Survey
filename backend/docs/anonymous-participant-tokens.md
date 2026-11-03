# Anonymous Participant Tokens

## Issuance

`POST /api/v1/public/forms/:formId/participant-tokens` issues a token only for a published, open, anonymous Form. The raw token is returned in that response only. The database stores its SHA-256 hash in the `ParticipantToken` collection; do not log the raw token or its hash.

Tokens do not expire. They are usable while their Form is published, open, and anonymous, become unusable while the Form is unavailable, and become usable again if the Form is reopened in that eligible state. A token can submit at most one Response.

The issuance endpoint is limited to 10 requests per IP per 15 minutes and returns `429` with `Retry-After` when the limit is exceeded.

## Submission

Submit to `POST /api/v1/forms/:formId/responses`, passing the raw token in `X-Participant-Token`. Keep the request body in its existing form:

```json
{
  "answers": [
    { "questionId": "<block-id>", "value": "<answer>" }
  ]
}
```

Identified Forms continue to require a JWT in `Authorization`; participant tokens do not replace JWT identity. Invalid or unknown participant tokens receive `401`; a consumed token receives `409`.

## Form closure and submission

Both identified and anonymous submissions perform a conditional Form `writeFence` update inside a MongoDB transaction. The update verifies that the Form still exists, is published, has open access, and uses the matching identity mode. The fence update and Response creation commit together, so a failed eligibility check or answer validation leaves no Response or fence change. Anonymous token verification, legacy duplicate detection, conditional consumption, and Response creation use the same transaction session; invalid answers do not consume or repair a token marker. Token issuance and Form deletion use the same Form-level fence protocol. If deletion commits first, later submissions and token issuance fail; if a write commits first, a subsequent Form deletion removes its associated Responses and participant tokens.

## Deployment requirements

- The limiter uses Express's client IP. Do not enable broad `trust proxy` settings. Configure proxy trust only after confirming the actual trusted proxy addresses or hop count; incorrect trust can make client IPs spoofable or make all respondents share one rate-limit key.
- The default limiter store is in memory and is per application process. A deployment with multiple backend instances may need a shared rate-limit store to enforce one global per-IP limit. Do not add that store unless the deployment topology requires it.
- Before relying on concurrent anonymous-submission protection in production, verify that the unique Response index on `{ form, participantTokenHash }` exists and is unique. The schema declaration and Memory Server tests do not verify production database index state.
- If Response persistence succeeds but the token's `consumedAt` update fails, keep the Response. Its unique index prevents another Response for that Form/token; retries return `409` and may repair the consumed marker.

## Response listing index consideration

If owner-scoped Response listing and submission-date sorting need further optimization, `{ form: 1, submittedAt: -1, _id: -1 }` is a future compound-index candidate only. No index is being added in this change, and actual MongoDB Atlas indexes have not been verified.
