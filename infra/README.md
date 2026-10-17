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

CDK creates one Node.js 24 Lambda (128 MB, 28-second timeout), its execution role with log writing and read access to the specified secret only, an HTTP API, POST `/contact` route, Lambda proxy integration and invoke permission, a default stage (5 requests/second, burst 10), and two CloudWatch log groups (30-day retention). Optional custom domain mode adds a regional API Gateway domain, API mapping and DNS-validated ACM certificate, unless an existing certificate ARN is supplied.

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

Use the Secrets Manager console to enter these values without placing them in shell history or repository files. Set its existing name as `contactSecretName` in the stage JSON. The function reads it at runtime and caches it for at most five minutes. The keys never appear in CloudFormation or public frontend variables. If you use your own KMS key instead, add narrowly scoped decrypt permission for that key before deploying.

In Brevo:

1. Create distinct leads and newsletter lists; record their numeric IDs. The function rejects identical IDs, so inquiries cannot accidentally imply newsletter consent.
2. Create normal contact attributes `NAME`, `COMPANY`, `PHONE`, `MESSAGE`, `UTM_SOURCE`, `UTM_MEDIUM`, `UTM_CAMPAIGN`, `UTM_CONTENT`, `UTM_TERM`, `LOCALE` as **text**, and `MARKETING_CONSENT` as **boolean**. `PHONE` is custom text, not Brevo's SMS attribute. Ensure MESSAGE accommodates the form's 4,000-character maximum.
3. Authenticate `mail.plainlysmart.com` using Brevo's provided DNS records, verify `info@mail.plainlysmart.com`, and enable transactional sending for the account.
4. Confirm `info@plainlysmart.com` is a working inbox for notifications and replies.

Contact creation uses `updateEnabled: true`, so an existing email is updated and a 204 response succeeds. Newsletter list membership is only added when the current checkbox is true. An unchecked inquiry does not unsubscribe an existing subscriber or override Brevo's suppression state. `MARKETING_CONSENT` records the latest inquiry's checkbox, not a complete historical consent ledger. Manage unsubscribes and campaign eligibility in Brevo.

In Cloudflare Turnstile, create a widget allowing `plainlysmart.com` and `www.plainlysmart.com`. Add localhost/127.0.0.1 only for a development widget. Set its public site key in the frontend and corresponding secret in Secrets Manager. The widget uses action `contact`; the backend checks both action and returned hostname. Tokens are single-use, so the frontend obtains a new one after an unsuccessful request.

## Configuration

### Resource naming and stage

Explicit resource names use `ps-{stage}-{purpose}`. CDK context `stage` defaults to `prod`; select another environment with `-c stage=dev`. Values must be 1–32 lowercase letters/digits with single separating hyphens, starting with a letter. Keep the same stage on synth, diff, deploy and destroy. This deployment stage does not change the API Gateway `$default` stage or routes.

The CloudFormation stack is `ps-prod-contact`, Lambda is `ps-prod-contact-handler`, HTTP API is `ps-prod-contact-api`, and access log group is `ps-prod-contact-access-logs`. Lambda logs use `/aws/lambda/ps-prod-contact-handler`. The CDK stack selector remains `PlainlySmartContact`; all construct IDs remain unchanged. IAM role names remain generated, as do CDK bootstrap asset bucket names.

Stack tags propagate to supported resources: `Project=Plainlysmart`, `ProjectCode=ps`, `Environment={stage}`, and `ManagedBy=CDK`. The existing secret is imported by name, so CDK cannot rename or tag it. Set `contactSecretName` to the actual external secret name; the checked-in files use `ps-prod-contact` and `ps-dev-contact`.

From `infra`, using the existing stack selector:

```sh
npm run synth -- PlainlySmartContact -c stage=prod
npm run diff -- PlainlySmartContact -c stage=prod --method template
npm run deploy -- PlainlySmartContact -c stage=prod
```

### Existing deployment migration

Previously the CloudFormation stack name defaulted to `PlainlySmartContact`. Changing it to `ps-prod-contact` creates a separate stack; CDK does not rename or migrate the existing stack. Confirm deployed state before deploying and plan endpoint/DNS cutover and retirement of the old stack. A custom domain already owned by the old stack cannot be created concurrently by the new stack; plan its transfer before deploying with that context. Imported secrets and certificates remain external.

Within an existing stack, adding the explicit Lambda function name and both log group names requires replacement; the API display-name change updates in place. Log groups have `RemovalPolicy.DESTROY`, so replacement/deletion can lose existing logs; export any logs needed first. Construct IDs and resource logical IDs are preserved, but a new stack still creates new resources and an API endpoint. Changing `stage` also selects a separate stack with distinct names. Review `npm run diff -- PlainlySmartContact -c stage=prod --method template` with credentials before deployment.

Frontend variables are baked into the static build; rebuild/redeploy after changes:

| Root `.env.local` / static hosting build variable | Value                                                                   |
| ------------------------------------------------- | ----------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`                        | API output URL, or `https://api.plainlysmart.com`; no `/contact` suffix |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`                  | Public widget site key                                                  |
| `NEXT_PUBLIC_BOOKING_URL`                         | Optional HTTPS external appointment page                                |

### Stage configuration files

CDK reads `config/{stage}.json` relative to the infrastructure package, with `prod` as the default. Missing files, malformed JSON, missing/unknown fields, invalid types, identical or non-positive list IDs, invalid email addresses, secret names, booking URLs and hostnames fail before synthesis. Add another file to support another valid stage.

Required structure (current production values):

```json
{
  "brevoLeadsListId": 3,
  "brevoNewsletterListId": 4,
  "contactSecretName": "ps-prod-contact",
  "contactNotificationEmail": "info@plainlysmart.com",
  "contactReplyToEmail": "info@plainlysmart.com",
  "brevoSenderEmail": "info@mail.plainlysmart.com",
  "brevoSenderName": "PlainlySmart",
  "bookingUrl": "",
  "turnstileHostnames": [
    "plainlysmart.com",
    "www.plainlysmart.com",
    "localhost",
    "127.0.0.1"
  ]
}
```

The existing production file's list IDs and secret name are preserved. Development IDs initially mirror production because no separate IDs were supplied: configure separate development lists and verify the external development secret before deploying dev. All fields are required; `bookingUrl` may be empty. Keep both frontend/backend booking settings aligned when used. Existing CORS origins and Turnstile hostname defaults are preserved; restrict production `turnstileHostnames` to your production widget's hostnames when ready.

These settings replace all contact CloudFormation parameters. Lambda receives the list IDs, email settings, booking URL and hostnames as non-sensitive environment values, plus `CONTACT_SECRET_NAME` solely to locate the secret. The SDK retrieves credentials at runtime; no secret value is resolved by CDK. IAM allows reads of the named secret with Secrets Manager's six-character ARN suffix only; no secret resource is created. Keep `BREVO_API_KEY` and `TURNSTILE_SECRET_KEY` exclusively in the external secret, never in these files or Lambda environment variables.

Production defaults to `api.plainlysmart.com`; development has no custom domain unless `domainName` context is supplied. The existing `domainName`/`certificateArn` overrides remain supported. Keep overrides consistent on subsequent deployments; changing a domain can replace its domain/certificate resources.

For an existing deployment, copy the current deployed parameter values into the appropriate stage file before deploying, including the exact secret name. This removes parameter references and updates Lambda configuration and secret-read IAM permissions without changing resource names or architecture. Review the diff against the deployed stack; file values replace any previously supplied parameter overrides.

## Deploy and find the URL

Authenticate AWS CLI using your normal profile/SSO. Choose an account and region (for example eu-central-1). Bootstrap once per account/region, from `infra`:

```sh
npx cdk bootstrap aws://YOUR_ACCOUNT_ID/eu-central-1
npm run synth
npm run deploy -- -c stage=prod --outputs-file cdk.out/outputs.json
```

Use `--profile YOUR_PROFILE` on CDK commands if needed. Set the profile's region to the same region as your secret. Set `bookingUrl` in the selected stage JSON if needed.

CDK prints `ApiUrl` (base) and `ContactUrl` (full endpoint). They also appear in `infra/cdk.out/outputs.json` and CloudFormation stack Outputs. Put `ApiUrl` into the frontend variable for first-deployment testing. Rebuild the static website independently with `npm run build` from the repository root.

To remove resources:

```sh
cd infra
npm run destroy
```

If you deployed with custom-domain context, pass the same context on subsequent synth/deploy/destroy commands. Never commit keys, generated outputs or local context.

## Cloudflare custom domain

Production now requests `api.plainlysmart.com` by default. The existing `ContactApi`, `ContactFunction`, routes, integration, default stage, IAM and log construct IDs are preserved. The domain maps the root path to the existing HTTP API's `$default` stage. No Cloudflare DNS changes are automated and no Route 53 resources are added.

For the existing **`ps-prod-contact` in `eu-central-1`**, run these checks from `infra` with your production AWS profile configured:

```sh
npm run typecheck
npm test
npm run synth -- PlainlySmartContact -c stage=prod --region eu-central-1
aws sts get-caller-identity
npm run diff -- PlainlySmartContact -c stage=prod --region eu-central-1 --method template
```

Review the deployed diff before proceeding. The domain change should add only an ACM certificate, regional API Gateway domain and API mapping, plus outputs. Stop if the API, Lambda, routes, integration, IAM or logs would be replaced or deleted. Other pending repository changes may appear in the diff and must be reviewed separately. Template-only diff does not provide the full replacement analysis of a CloudFormation change set. Do not change stack/stage names or bootstrap the already deployed environment for this update.

When ready, the operator can start deployment (this command is documented, not run automatically):

```sh
npm run deploy -- PlainlySmartContact -c stage=prod --region eu-central-1 --outputs-file cdk.out/outputs.json
```

While that command waits, open ACM in **eu-central-1**, select the pending certificate for `api.plainlysmart.com`, and copy its DNS validation record into Cloudflare:

| Type | Name | Target | Proxy | TTL |
| ---- | ---- | ------ | ----- | --- |
| CNAME | `_TOKEN.api` (from ACM's `_TOKEN.api.plainlysmart.com`) | Exact ACM value, typically `_TOKEN.acm-validations.aws` | DNS only | Auto |

The tokens are generated by ACM during deployment and cannot be obtained from local synthesis or stack outputs before validation. Copy the actual name/value, including leading underscores; do not duplicate the zone suffix when entering the name. This validation record is separate from the `api` traffic record below. Leave validation CNAME flattening disabled and retain the record for renewal. If issuance stalls, verify public DNS resolution and any CAA restrictions. CloudFormation waits for issuance before creating the domain/mapping; complete validation while deployment is in progress. See [ACM DNS validation](https://docs.aws.amazon.com/acm/latest/userguide/dns-validation.html).

Alternatively obtain/validate a certificate first and also pass `-c certificateArn=YOUR_REGIONAL_ACM_CERTIFICATE_ARN`. The existing certificate must cover `api.plainlysmart.com` in the same AWS region.

After deployment add this Cloudflare record:

| Type  | Name  | Target                                                                               | Proxy    | TTL  |
| ----- | ----- | ------------------------------------------------------------------------------------ | -------- | ---- |
| CNAME | `api` | Stack output `CloudflareCnameTarget` (regional API Gateway hostname; no scheme/path) | DNS only | Auto |

Then use `https://api.plainlysmart.com` as `NEXT_PUBLIC_API_BASE_URL` and rebuild the static site. The API mapping has no path prefix; POST remains `/contact`. No Route 53 hosted zone is created.

After deployment, outputs are `CloudflareCnameTarget` (regional target), `CustomApiUrl` (`https://api.plainlysmart.com`) and `CustomContactUrl` (`https://api.plainlysmart.com/contact`). Existing `ApiUrl` and `ContactUrl` continue to expose the execute-api endpoint. Update the Cloudflare Pages production build variable and rebuild/redeploy the frontend separately after DNS resolves. The production origin `https://plainlysmart.com` is already allowed by CORS.

Repeat deployments with the same stage, region and context reuse the same resources. Tests compare the full existing resource definitions with and without the domain and verify stable repeated synthesis; they cannot prove the live stack matches this checkout. The change adds no Lambda execution permissions. API Gateway may create its AWS-managed service-linked role on first regional custom-domain use. Normal API/Lambda/DNS usage charges still apply; no always-on compute is added. See [regional custom domains](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-regional-api-custom-domain-create.html).

## Responses, logging and delivery limits

Success is 200 `{ "success": true }`, only after all three Brevo calls succeed. Invalid input returns 400 `INVALID_REQUEST`; oversized bodies return 413 `REQUEST_TOO_LARGE`; verification rejection returns 403 `TURNSTILE_FAILED`; provider failures return 502 `SERVICE_UNAVAILABLE`; configuration failures return 500 `SERVICE_UNAVAILABLE` (all error envelopes include `success: false`). API Gateway may itself return throttling/infrastructure errors; the frontend handles non-success and malformed responses.

Input fields are trimmed, length-limited and type-checked; locale defaults to English and only `en`/`cs` are accepted. User content is sent as plain-text email. Logs contain request IDs and stage outcomes, without request bodies, email addresses, tokens, provider response bodies or credentials. API access logs omit source IP and query strings.

External requests have four-second deadlines. No provider calls are automatically retried. This deliberately small synchronous architecture cannot provide atomic delivery: if a lead saves but a later email fails, the API reports failure and the saved lead remains. A user retry upserts the contact but can duplicate an already sent email; a timeout can also have an ambiguous outcome. Use request IDs and stage logs to investigate. Brevo acceptance does not guarantee inbox delivery. Exactly-once submission or durable email retries would require additional state/infrastructure, which this stack intentionally omits.

References: [AWS Node.js runtimes](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html), [Turnstile validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [Brevo contact upsert](https://developers.brevo.com/reference/create-contact), [Brevo transactional email](https://developers.brevo.com/reference/send-transac-email).

# backlog

Navigation links size 15
add professional tags
senior engineering => high level engineering
build around you - weird icon
mobile app tile text
