# Compliance implementation and publication checklist

Source audit: 17 October 2026. Technical controls are implemented; this is not a legal compliance certification. Both public policies explicitly remain drafts. Do not publish as a finalized notice until the outstanding details below are resolved.

## Identity and dates

Edit src/lib/business.ts: legalName, ico, address, registry (or a verified localized statement that registration is not applicable), email, privacyEmail (defaults to info@plainlysmart.com), effectiveDate and updatedDate. Dates currently identify this draft, not an approved policy. Public values are baked into the static export; rebuild after changes. Never place secrets here. Copyright year is evaluated during export, so rebuild annually.

## Data flow and purposes

Browser -> HTTPS API Gateway -> Lambda -> Cloudflare Siteverify -> Brevo contacts and transactional mail -> business inbox and visitor confirmation. Browser Turnstile also contacts Cloudflare when the configured form opens. Form: name, email, optional phone, message, locale, optional marketing flag. Backend additionally accepts optional company and bounded campaign parameters. Brevo stores contact attributes including the message. Campaign attribution is collected only following separate permission. API Gateway and hosting necessarily process network metadata; do not confuse processing with application logging.

Confirm Article 6(1)(b) for requested precontractual steps, Article 6(1)(f) for other correspondence/security with a legitimate-interest assessment, and Article 6(1)(a) for optional newsletters and attribution. Storage consent and GDPR legal basis are separate assessments. Newsletter checkbox remains optional and unchecked. An unchecked later inquiry does not unsubscribe an existing newsletter subscriber. Business must implement/verify unsubscribe and consent-evidence procedures, including policy version, time and source; the current backend flag alone is not a complete consent register. Attribution choice is browser-local and is not a server consent ledger.

## Cookie and storage audit

No first-party document.cookie writes, analytics SDKs, marketing pixels, remote fonts or media embeds were found. next-intl locale cookie/detection is disabled. Local theme script is first party. Theme localStorage key theme and explicit language key preferredLocale implement requested preferences and persist until changed/cleared. Their exemption classification requires legal confirmation.

Existing sessionStorage plainlysmart.utm is non-essential marketing attribution, not a necessary security feature. Consequently a small localized footer consent panel now offers identically styled accept/reject buttons, default off, with a persistent Privacy preferences control. localStorage plainlysmart.attribution-consent.v1 stores accepted/rejected until changed/cleared. No attribution session storage is read or written before acceptance (legacy data is removed); no campaign fields are returned on rejection. Withdrawal clears memory and session data before future submissions. Blocked consent storage fails closed. Root redirect preserves the query so acceptance on the destination can capture it; no campaign is stored during redirect without prior consent. Campaign URLs may still reach hosting logs: verify host query logging. Consent does not retrospectively delete already submitted records. No general script consent manager or new tracking service was introduced.

Turnstile is loaded only with the configured open contact form, action contact, compact widget, hostname/action validation and four-second server verification timeout. Inspect deployed cookies, pre-clearance and provider settings; source inspection cannot establish every provider-side device operation. Confirm the strictly necessary security exemption and information duties. Hosting/platform analytics, cookies and access logs are outside this repository and must be inspected before publication. Optional scheduling is an external link, not an embed; review the configured provider separately. If future non-essential scripts are added, gate them before loading and extend preferences.

## Backend review

API Gateway uses HTTPS; optional regional custom domain requires TLS 1.2. Frontend hosting redirects/HSTS are outside this stack and unverified. Outbound provider URLs use HTTPS. Secrets Manager holds backend credentials, cached privately for five minutes; only public API URL/site key are shipped to the browser. Secret lookup uses CONTACT_SECRET_NAME, scoped to the configured secret name and generated ARN suffix. IAM log writes target this function log group. No broad managed execution policy is used.

Lambda logs request ID and fixed stage outcomes, never payload/provider error details. API access format includes request ID/status/route/integration status/latency, not IP, query, user agent or body. Both log groups explicitly retain 30 days. Error responses use fixed envelopes and no-store. Throttling remains 5 requests/second, burst 10. Input validation, token verification and mail delivery remain intact. No runtime infrastructure changes were necessary; regression assertions lock down these existing controls. No additions, replacements, IAM expansion, paid services or deployment. Both existing log groups have DESTROY removal policy; stack removal/replacement loses logs. Tests and synthesis verify source intent, not live configuration.

## Retention decisions and processors

Only the infrastructure log retention (30 days) is verified from code. Owner must approve and publish specific periods or deletion criteria for inquiries/leads, messages, inbox/sent copies, newsletters, consent evidence, suppression lists, provider delivery/security logs and backups. Implement an operational review/deletion schedule after approval; none is invented or automatically enforced here. Synchronous delivery can partially succeed before failure; a failed form response does not prove no data was retained.

AWS, Brevo and the mailbox/hosting providers may act as processors for specific activities; Cloudflare Turnstile roles must be checked against its current notice and contracts rather than assumed. Verify contracting entities, DPAs, subprocessors, actual account regions, international destinations and applicable adequacy decisions/SCCs and supplementary measures. Do not claim EU-only processing or guaranteed safeguards without evidence.

## Access and deletion procedure

1. Receive requests at business.privacyEmail; log receipt and deadline in a restricted register.
2. Verify identity proportionately without routinely demanding identity documents.
3. Locate Brevo contact/list memberships, inbox/sent mail and applicable provider logs/backups. Logs deliberately have no contact identifiers; do not add personal data just to make them searchable.
4. Assess access/export, rectification, restriction, portability, objection or deletion and applicable legal exceptions. Coordinate processor actions and explain backup expiry and any lawful retention.
5. Reply normally within one month; explain lawful extensions on time. Record actions, recipients, exemptions and completion with minimal evidence. Withdrawal stops future consent-based processing and does not invalidate prior lawful processing.

## Legal review before publication

Supply legal name, IČO, registered address and registry information. Confirm privacy mailbox ownership, dates, actual providers and roles, lawful bases, legitimate interests, all missing retention rules, transfer safeguards, newsletter consent evidence/unsubscribe, preference/security storage exemptions and deployed hosting settings. Review Czech business identification obligations and notice completeness. Logical headings, keyboard links, responsive layout and theme support are technical checks, not full WCAG or European Accessibility Act certification.

## Official references consulted

- ÚOOÚ cookie guidance: https://uoou.gov.cz/verejnost/qa-otazky-a-odpovedi/cookies (non-essential storage needs opt-in; technical-only sites do not automatically need a banner).
- Cloudflare Turnstile privacy notice: https://www.cloudflare.com/turnstile-privacy-policy/ (verify current processing and roles).
- GDPR text: https://eur-lex.europa.eu/eli/reg/2016/679/oj (review Articles 6, 12–22, 28 and 44–49).

## Change inventory

Added: src/lib/business.ts; src/components/BusinessIdentity.tsx; src/components/PrivacyPreferences.tsx; src/app/[locale]/privacy/page.tsx; tests/compliance.spec.ts; docs/compliance.md.
Updated: messages/en.json; messages/cs.json; src/app/globals.css; src/app/sitemap.ts; src/components/home/HomeFooter.tsx; src/components/booking.tsx; src/components/LocaleEntry.tsx; src/lib/contact-tracking.ts; tests/booking.spec.ts; tests/console.spec.ts; infra/tests/handler.test.ts; infra/tests/stack.test.ts.

Privacy links disable speculative prefetch because this Next.js export emits nested segment files that the current static preview does not resolve via flattened prefetch URLs. Normal navigation and exported HTML work. Console tests now mock Turnstile, consistent with contact tests, rather than contacting an external security provider.

## Validation results

- Root npm run typecheck: passed; infra npm run typecheck: passed.
- Production npm run build: passed, including /en/privacy and /cs/privacy, under both mocked contact configuration and the existing production environment. Final out/ was rebuilt without test overrides.
- Root npm test: 66 passed, no skips, against the fresh static export with public test configuration and mocked contact/Turnstile requests. Includes both locales, disclosure/footer, metadata/sitemap, consent/withdrawal, mobile/desktop and theme/navigation regressions.
- Infra npm test: 35 passed, no skips, using mocked providers. Local CDK synthesis for PlainlySmartContact stage=prod passed. Windows sandbox user-information/process-cleanup restrictions required these test/synth commands to run outside the sandbox; no AWS deployment was performed.
- npm run lint: blocked before linting by the existing installed TypeScript 7.0.2 incompatibility with typescript-eslint. Dependencies were not changed for this unrelated tooling issue.
- git diff --check: passed. No full manual accessibility or deployed provider audit is claimed.
