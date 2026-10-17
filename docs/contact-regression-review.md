# Contact/Brevo regression review

Reviewed against `8e8d97a` (the repository version before GDPR finalization), using `git diff HEAD -- ...` so staged and unstaged changes were both included. Nothing deployed, no production resources or provider settings changed. The deployed Lambda artifact and provider dashboards were not read; deployed compatibility below assumes its contract matches the reviewed baseline.

## Findings and fix

1. **Breaking cached-client regression, fixed:** GDPR finalization changed request validation to reject `marketingConsent: true`. An old cached form with its checkbox selected would receive HTTP 400 before Turnstile/Brevo; neither inquiry notification nor confirmation would be sent. The validator now accepts the original optional boolean wire type and discards it. The normalized ContactRequest no longer contains marketingConsent. Invalid non-boolean values still produce 400. Brevo always receives only the leads list; neither MARKETING_CONSENT nor suppression/list removals are written. This does not re-enable signup.
2. **Updated frontend to old Lambda is compatible:** the old validator already allowed omission of marketingConsent and normalized it to false. The updated form omits the field. A frozen copy of the actual validator from `8e8d97a:infra/lambda/validation.ts` checks this with both browser-generated and backend test payloads. This proves the reviewed source contract, not the identity of the currently deployed artifact.
3. **No other transactional regression found:** provider URLs, API key headers, secret loading/caching, send order, recipient configuration, sender/reply-to, localized confirmation content and optional booking link are unchanged. The notification text intentionally drops only the obsolete marketing-consent line; all inquiry fields remain. No Brevo template ID was removed: these emails have always been sent as inline localized textContent.

## Checks against the baseline

| Area | Result |
| --- | --- |
| Frontend endpoint | Still POST `${NEXT_PUBLIC_API_BASE_URL}` (trailing slash trimmed) + `/contact`, JSON content-type; 35-second deadline and HTTP + success-envelope checks unchanged |
| Payload | name/email/message, optional phone, locale and turnstileToken; opt-in UTM fields only. Company remains backend-only optional input. No newsletter control/type/default/payload field in current form |
| Validation | Required fields, normalization, lowercased email, NFC, control-character checks, locale/length limits, 24,000-byte decoded-body cap and base64 support retained; deprecated boolean accepted then discarded |
| Turnstile | Browser action contact, locale and token lifecycle unchanged; server Siteverify URL, four-second timeout, expected action and allowed hostname checks unchanged |
| Brevo contacts | Same `/v3/contacts`, updateEnabled and inquiry attributes. Only newsletter list addition and MARKETING_CONSENT assignment removed. Lead storage still precedes emails |
| Inquiry notification | Same `/v3/smtp/email`; production source recipient info@plainlysmart.com, subject New PlainlySmart inquiry; configured sender and reply-to preserved |
| Customer receipt | Same endpoint, normalized customer email recipient, English/Czech subject/body and optional consultation link; no newsletter campaign or subscription implied |
| API/infra | No diff in CDK resource definitions, stage JSON, entry point, runtime config, .env.example, Turnstile component or attribution implementation. POST /contact, payload v2, origins, headers, preflight, throttles and resource identity retained |

Keep `BREVO_NEWSLETTER_LIST_ID` and the distinct stage-config list ID for now: runtime/config validation still requires them for compatibility, even though sending code never uses that list. Removing the environment variable independently would cause configuration failures. No new environment variables or secret keys are needed.

## Deployment compatibility and order

| Static frontend | Lambda | Transactional inquiries | Newsletter behavior |
| --- | --- | --- | --- |
| Updated, omits field | Baseline 8e8d97a | Compatible: omission defaults to false | No new subscription from updated form; old backend writes MARKETING_CONSENT=false on contact upsert and does not remove existing memberships |
| Old cached form, false | Updated/fixed | Compatible | Boolean ignored; leads-only upsert |
| Old cached form, true | Updated/fixed | Compatible after this fix; previously 400 | Boolean ignored; leads-only upsert |
| Updated | Updated/fixed | Compatible | No signup |
| Old cached form, true | Baseline 8e8d97a | Original behavior | Old code still adds newsletter membership; frontend release alone cannot disable the old backend for cached clients |

When a release is separately authorized, deploy the **fixed backend first**, preserving its existing environment/secret values and API URL, then publish the updated static frontend. This disables signup even for cached old clients while continuing to send inquiry emails. Frontend-first also preserves transactional delivery for updated clients, but leaves the old newsletter path active until the backend is replaced. A backend rollback to the baseline would similarly restore its old subscription behavior for cached requests. No coordinated simultaneous cutover or new endpoint is required after this fix.

Existing Brevo subscriptions/suppression are not removed or rewritten on the fixed backend. Audit provider automations/campaign eligibility separately: source changes cannot establish that a leads list is excluded from marketing. The baseline backend's consent-attribute overwrite is pre-existing behavior, not an unsubscribe mechanism; avoid treating that attribute as a complete consent register.

## Regression coverage

- `infra/tests/browser/contact-flow.spec.ts`: real exported form -> captured JSON request -> real Lambda -> mocked Secrets Manager, Siteverify and Brevo -> real response -> UI. Both languages assert exact payload, legacy-validator acceptance, action/locale/token, provider call order, API-key headers, leads-only attributes, notification recipient/subject/body and exact customer confirmation. Failure cases cover Turnstile rejection, notification failure and confirmation failure with retained form data and no false success.
- `infra/tests/support/contact-harness.ts`: test-only provider interception; unexpected outbound URLs fail rather than access a live service; uses non-secret prod recipient/list/sender settings and fake credentials; restores mocks/environment.
- `infra/tests/fixtures/pre-compliance-validation.ts`: unmodified historical validator with provenance; imported only by tests.
- `infra/tests/handler.test.ts`: omitted/false/true legacy boolean each delivers both transactional emails, never subscribes, and is absent from normalized data. Existing bad-input, base64, timeout/network, provider-error and sensitive-log assertions retained.
- `tests/booking.spec.ts`: form validation, optional phone, duplicate-submit guard, failed draft/retry and regenerated widget, opt-in attribution/rejection, no subscription UI/payload, responsive dialog.
- `infra/tests/stack.test.ts`: existing resource/config/environment assertions plus exact allowed CORS origins, POST/content-type and one-hour preflight max-age. Browser route interception bypasses actual API Gateway/CORS; stack assertions establish configuration intent, not live behavior.

## Limits

The synchronous process remains non-atomic: a lead can be saved before an email failure; notification can succeed before confirmation failure. The API reports provider failure and the browser preserves the draft; retries can duplicate email. Brevo API acceptance is not proof of delivery to an inbox. These behaviors predate the compliance changes. No live challenge, secret/key validity, sender authentication, actual mailbox delivery or deployed configuration was exercised or claimed.

## Running the checks and results

The cross-package browser tests are intentionally separate from the frontend-only default suite, so a frontend build does not acquire a dependency on the infra package. Install both packages (`npm ci` and `npm --prefix infra ci`) before this integration suite; no new dependencies were added. Build with the normal public contact configuration first; without API/site-key configuration submission tests explicitly skip rather than make live calls.

```powershell
npm run typecheck
npm --prefix infra run typecheck
npx tsc --project infra/tests/browser/tsconfig.json --noEmit
npm run build
npx playwright test tests/booking.spec.ts
npm run test:contact-flow
npm --prefix infra test
```

Results for this review: root/infra/integration TypeScript checks passed; production static build passed; 8 existing contact browser regressions and 5 new real-handler browser regressions passed (zero skipped). Full backend suite: 38 passed, zero skipped. After tightening the CORS assertion, the focused CDK API/environment/CORS test passed separately (1 passed, zero skipped). `git diff --check` passed. Windows sandbox user/process restrictions required test runners outside the sandbox; provider traffic was mocked throughout. No AWS reads, deployment or provider-account changes were used. The existing lint/TypeScript 7 incompatibility recorded in docs/compliance.md was not changed by this review.
