# PlainlySmart contact backend

The website remains a Next.js static export. Its consultation modal POSTs JSON to `${NEXT_PUBLIC_API_BASE_URL}/contact`. API Gateway HTTP API uses Lambda proxy payload v2. Lambda validates input, verifies Turnstile, upserts the Brevo lead, sends an internal notification, then sends an English/Czech confirmation. No Next.js server, Route Handler, database, queue, VPC, or Google Calendar integration is involved.

## Files

- `bin/contact.ts`, `lib/contact-stack.ts`, `cdk.json`: CDK entry point and infrastructure.
- `lambda/{handler,validation,config,services}.ts`: handler, normalization, Secrets Manager configuration, Turnstile and Brevo REST calls.
- `tests/*.test.ts`: direct handler tests with all external requests mocked, and CDK assertions.
- `package.json`, `package-lock.json`, `tsconfig.json`, `.gitignore`: independent backend tooling.
- `../src/components/booking.tsx`, `Turnstile.tsx`: existing modal integration and verification widget.
- `../src/lib/contact-tracking.ts`, `../src/components/LocaleEntry.tsx`: session UTM capture, including before the root locale redirect.
- `../messages/{en,cs}.json`, `../src/app/globals.css`, `../tests/booking.spec.ts`: form copy, checkbox/disabled styling, browser coverage.
- `../.env.example`, `../tsconfig.json`, `../eslint.config.js`: frontend configuration and separation from infrastructure artifacts.

## AWS resources

CDK creates one Node.js 24 Lambda (256 MB, 28-second timeout), its execution role with log writing and read access to the specified secret only, an HTTP API, POST `/contact` route, Lambda proxy integration and invoke permission, a default stage (5 requests/second, burst 10), and two CloudWatch log groups (30-day retention). Optional custom domain mode adds a regional API Gateway domain, API mapping and DNS-validated ACM certificate, unless an existing certificate ARN is supplied.

The secret is provisioned separately and is not deleted by this stack. No AWS resources are created by `synth` or tests. Deployment incurs normal AWS usage charges. Destroy removes the API, Lambda and stack-owned log groups, and any stack-owned domain/certificate. Remove custom DNS records separately.

CORS allows only `POST` and `content-type` from `https://plainlysmart.com`, `https://www.plainlysmart.com`, `http://localhost:3000`, `http://127.0.0.1:3000`, and the static test origin `http://127.0.0.1:4173`. API Gateway handles OPTIONS automatically. Lambda does not duplicate CORS headers. CORS is a browser policy; Turnstile is checked for every submission.

## Install and test locally

Use Node.js 24 and npm. From the repository root:

```sh
npm ci
npm run build
cd infra
npm ci
npm run typecheck
npm test
npm run synth
```

Backend tests directly invoke the handler; HTTP and Secrets Manager are mocked. They need no AWS account, credentials, Brevo key or real Turnstile token. CDK uses local esbuild, not Docker. No emulation service is necessary for this single endpoint.

For frontend development set the variables below in root `.env.local`, then `npm run dev` (localhost:3000). Point the API base at your deployed development API for live integration testing. Live submissions save Brevo contacts and send emails. Use a separate development secret/lists and Cloudflare test keys for this workflow, never a test secret in production.

Browser tests intercept Turnstile and the API. To exercise success/failure/UTM behavior, build with public configuration first. PowerShell example from the root:

```powershell
$env:NEXT_PUBLIC_API_BASE_URL='https://api.plainlysmart.com'
$env:NEXT_PUBLIC_TURNSTILE_SITE_KEY='1x00000000000000000000AA'
npm run build
npx playwright test tests/booking.spec.ts
```

Do not publish that test build. Without public configuration, the form shows an email fallback and disables submission; browser tests check that fallback and skip the request-flow test.

## Secrets and Brevo setup

Create one AWS Secrets Manager **Other type of secret** in the deployment region, using the default Secrets Manager encryption key. Its JSON must contain:

```json
{
  "BREVO_API_KEY": "your-private-Brevo-v3-API-key",
  "TURNSTILE_SECRET_KEY": "your-private-Turnstile-secret"
}
```

Use the Secrets Manager console to enter these values without placing them in shell history or repository files. Copy the full ARN including its random suffix as `ContactSecretArn`. The function reads it at runtime and caches it for at most five minutes. The keys never appear in CloudFormation or public frontend variables. If you use your own KMS key instead, add narrowly scoped decrypt permission for that key before deploying.

In Brevo:

1. Create distinct leads and newsletter lists; record their numeric IDs. The function rejects identical IDs, so inquiries cannot accidentally imply newsletter consent.
2. Create normal contact attributes `NAME`, `COMPANY`, `PHONE`, `MESSAGE`, `UTM_SOURCE`, `UTM_MEDIUM`, `UTM_CAMPAIGN`, `UTM_CONTENT`, `UTM_TERM`, `LOCALE` as **text**, and `MARKETING_CONSENT` as **boolean**. `PHONE` is custom text, not Brevo's SMS attribute. Ensure MESSAGE accommodates the form's 4,000-character maximum.
3. Authenticate `mail.plainlysmart.com` using Brevo's provided DNS records, verify `info@mail.plainlysmart.com`, and enable transactional sending for the account.
4. Confirm `info@plainlysmart.com` is a working inbox for notifications and replies.

Contact creation uses `updateEnabled: true`, so an existing email is updated and a 204 response succeeds. Newsletter list membership is only added when the current checkbox is true. An unchecked inquiry does not unsubscribe an existing subscriber or override Brevo's suppression state. `MARKETING_CONSENT` records the latest inquiry's checkbox, not a complete historical consent ledger. Manage unsubscribes and campaign eligibility in Brevo.

In Cloudflare Turnstile, create a widget allowing `plainlysmart.com` and `www.plainlysmart.com`. Add localhost/127.0.0.1 only for a development widget. Set its public site key in the frontend and corresponding secret in Secrets Manager. The widget uses action `contact`; the backend checks both action and returned hostname. Tokens are single-use, so the frontend obtains a new one after an unsuccessful request.

## Configuration

Frontend variables are baked into the static build; rebuild/redeploy after changes:

| Root `.env.local` / static hosting build variable | Value                                                                   |
| ------------------------------------------------- | ----------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`                        | API output URL, or `https://api.plainlysmart.com`; no `/contact` suffix |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`                  | Public widget site key                                                  |
| `NEXT_PUBLIC_BOOKING_URL`                         | Optional HTTPS external appointment page                                |

CDK parameters map to Lambda configuration:

| CDK parameter              | Lambda variable              | Default                                           |
| -------------------------- | ---------------------------- | ------------------------------------------------- |
| `ContactSecretArn`         | `CONTACT_SECRET_ARN`         | Required, full secret ARN                         |
| `BrevoLeadsListId`         | `BREVO_LEADS_LIST_ID`        | Required positive integer                         |
| `BrevoNewsletterListId`    | `BREVO_NEWSLETTER_LIST_ID`   | Required distinct positive integer                |
| `ContactNotificationEmail` | `CONTACT_NOTIFICATION_EMAIL` | `info@plainlysmart.com`                           |
| `ContactReplyToEmail`      | `CONTACT_REPLY_TO_EMAIL`     | `info@plainlysmart.com`                           |
| `BrevoSenderEmail`         | `BREVO_SENDER_EMAIL`         | `info@mail.plainlysmart.com`                      |
| `BrevoSenderName`          | `BREVO_SENDER_NAME`          | `PlainlySmart`                                    |
| `BookingUrl`               | `BOOKING_URL`                | Empty; optional HTTPS booking page                |
| `TurnstileHostnames`       | `TURNSTILE_HOSTNAMES`        | Production hostnames plus localhost and 127.0.0.1 |

Set `TurnstileHostnames=plainlysmart.com,www.plainlysmart.com` on production deployment. Set both booking variables to the same scheduling page if desired. The email uses the backend value; the thank-you UI uses the public value.

## Deploy and find the URL

Authenticate AWS CLI using your normal profile/SSO. Choose an account and region (for example eu-central-1). Bootstrap once per account/region, from `infra`:

```sh
npx cdk bootstrap aws://YOUR_ACCOUNT_ID/eu-central-1
npm run synth
npm run deploy -- --parameters ContactSecretArn=YOUR_FULL_SECRET_ARN --parameters BrevoLeadsListId=YOUR_LEADS_ID --parameters BrevoNewsletterListId=YOUR_NEWSLETTER_ID --parameters TurnstileHostnames=plainlysmart.com,www.plainlysmart.com --outputs-file cdk.out/outputs.json
```

Use `--profile YOUR_PROFILE` on CDK commands if needed. Set the profile's region to the same region as your secret. Optional: append `--parameters BookingUrl=https://YOUR_SCHEDULING_PAGE`.

CDK prints `ApiUrl` (base) and `ContactUrl` (full endpoint). They also appear in `infra/cdk.out/outputs.json` and CloudFormation stack Outputs. Put `ApiUrl` into the frontend variable for first-deployment testing. Rebuild the static website independently with `npm run build` from the repository root.

To remove resources:

```sh
cd infra
npm run destroy
```

If you deployed with custom-domain context, pass the same context on subsequent synth/deploy/destroy commands. Never commit keys, generated outputs or local context.

## Cloudflare custom domain

The initial deployment does not require a domain or certificate. When ready, add `-c domainName=api.plainlysmart.com` to the deployment command above. CDK requests an ACM certificate **in the API's AWS region**. During deployment, open ACM and copy the certificate validation CNAME name/value to Cloudflare DNS (DNS only). Deployment waits for DNS validation. Keep that record for automatic renewal.

Alternatively obtain/validate a certificate first and also pass `-c certificateArn=YOUR_REGIONAL_ACM_CERTIFICATE_ARN`. The existing certificate must cover `api.plainlysmart.com` in the same AWS region.

After deployment add this Cloudflare record:

| Type  | Name  | Target                                                                               | Proxy    | TTL  |
| ----- | ----- | ------------------------------------------------------------------------------------ | -------- | ---- |
| CNAME | `api` | Stack output `CloudflareCnameTarget` (regional API Gateway hostname; no scheme/path) | DNS only | Auto |

Then use `https://api.plainlysmart.com` as `NEXT_PUBLIC_API_BASE_URL` and rebuild the static site. The API mapping has no path prefix; POST remains `/contact`. No Route 53 hosted zone is created.

## Responses, logging and delivery limits

Success is 200 `{ "success": true }`, only after all three Brevo calls succeed. Invalid input returns 400 `INVALID_REQUEST`; oversized bodies return 413 `REQUEST_TOO_LARGE`; verification rejection returns 403 `TURNSTILE_FAILED`; provider failures return 502 `SERVICE_UNAVAILABLE`; configuration failures return 500 `SERVICE_UNAVAILABLE` (all error envelopes include `success: false`). API Gateway may itself return throttling/infrastructure errors; the frontend handles non-success and malformed responses.

Input fields are trimmed, length-limited and type-checked; locale defaults to English and only `en`/`cs` are accepted. User content is sent as plain-text email. Logs contain request IDs and stage outcomes, without request bodies, email addresses, tokens, provider response bodies or credentials. API access logs omit source IP and query strings.

External requests have four-second deadlines. No provider calls are automatically retried. This deliberately small synchronous architecture cannot provide atomic delivery: if a lead saves but a later email fails, the API reports failure and the saved lead remains. A user retry upserts the contact but can duplicate an already sent email; a timeout can also have an ambiguous outcome. Use request IDs and stage logs to investigate. Brevo acceptance does not guarantee inbox delivery. Exactly-once submission or durable email retries would require additional state/infrastructure, which this stack intentionally omits.

References: [AWS Node.js runtimes](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html), [Turnstile validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [Brevo contact upsert](https://developers.brevo.com/reference/create-contact), [Brevo transactional email](https://developers.brevo.com/reference/send-transac-email).
