# PlainlySmart compliance record

Audit and implementation date: 17 October 2026. Owner: Jakub Heidtke (controller). This is a source review and operational runbook, not a legal certification. No deployment or provider-account changes were made. Public pages contain no internal draft warnings. Publication remains blocked by the account/contract checks below; removing warnings does not approve those facts. The policy dates are fixed in `src/lib/business.ts`, not derived from builds; confirm the effective date at release if publication occurs later.

## Verified assertions

- [x] Official ARES API `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/87128250`, read 17 October 2026: Jakub Heidtke, IČO 87128250, Edvarda Beneše 1731/12, Jižní Předměstí, 30100 Plzeň, country CZ / Česká republika. Public identity is centralized in `src/lib/business.ts`; translations hold labels only. Registry description supplied by the business.
- [x] Static Next.js export, English/Czech privacy and legal routes, local fonts/illustrations, no server-side frontend contact route. Existing Czech noindex policy preserved.
- [x] Form requires name, email and message; phone optional. No company control, although backend accepts an optional company. Both layers validate independently. No mandatory GDPR consent checkbox.
- [x] API Gateway -> Lambda -> Cloudflare Siteverify -> Brevo contact upsert -> internal email -> localized receipt confirmation. Synchronous, non-atomic: errors/timeouts can leave a saved contact or sent email. Retries can duplicate messages.
- [x] Brevo contact records include NAME, COMPANY, PHONE, MESSAGE, LOCALE and submitted UTM fields; there is no TTL or deletion operation. Repeated inquiries update the same contact; previous inquiries can remain in email histories and provider logs.
- [x] Newsletter signup removed: no verified consent register or campaign unsubscribe workflow was present. Backend accepts and discards the deprecated optional boolean `marketingConsent` (including true from cached forms), rejects non-boolean values, and omits the field from the normalized contact type. Newsletter signup stays disabled. Upsert includes only leads list and does not modify MARKETING_CONSENT or remove existing newsletter memberships/suppression. Existing subscribers require an account audit, not an inferred opt-out.
- [x] Confirmation is related to receipt of the inquiry. An optional booking link relates to that consultation, not a newsletter. Production stage JSON has no booking URL; environment/deployed overrides unknown. No newsletter campaign sender exists here.
- [x] Application logs contain request ID and fixed outcome only. Provider errors are sanitized. API access logs omit body, IP, user-agent and query parameters. Both CDK log groups explicitly use ONE_MONTH (30 days). Source intent does not verify deployed retention.
- [x] No application analytics SDK, advertising pixel, document.cookie writes, remote fonts or media embeds found. next-intl locale cookies/detection disabled. Optional attribution is opt-in and fails closed if consent storage is blocked.
- [x] No approved refund terms or capacity evidence found in repository. Removed money-back guarantee from both locations/languages and replaced last-three-client scarcity with neutral project availability.

## Personal-data inventory and flows

| Data | Where / recipients | Purpose and basis |
| --- | --- | --- |
| Name, email, message; optional phone/company; locale and correspondence | Browser draft -> AWS validation -> Brevo contact attributes, transactional message content and business inbox/sent/reply copies | Requested pre-contractual steps: Art. 6(1)(b) only when the individual requests steps towards their own possible contract. Other correspondence, including representatives of companies: Art. 6(1)(f) business communication. Do not classify every inquiry as pre-contractual. |
| IP, browser/device/TLS signals, origin/sitekey | Hosting, API networking; browser -> Turnstile; server -> Siteverify token, secret (no remoteip supplied) | Art. 6(1)(f), security and spam prevention. Cloudflare processor for site protection, independent controller for improving detection per current Turnstile notice. |
| Request ID, fixed processing outcome; route/status/integration status/latency | Lambda/API CloudWatch groups | Art. 6(1)(f), diagnostics/security. No submitted message or token logging. |
| UTM source/medium/campaign/content/term | Opt-in browser session -> inquiry payload -> Brevo contact | Prior optional storage permission; Art. 6(1)(a) consent for linked attribution. Not required to contact. Avoid personal identifiers in campaign URLs. |
| Theme, language and attribution choice | First-party browser storage only | Requested preferences and remembering privacy choice; not marketing profiling. |
| Client/project/accounting records | Business systems and advisers actually used (inventory pending) | Art. 6(1)(b) for individual's contract; Art. 6(1)(f) where applicable for business records/claims; Art. 6(1)(c) only for identified obligations, not a blanket basis. |
| Historical newsletter consent, subscription, suppression data | Existing Brevo lists/automations, if any | No new signup. Audit evidence and eligibility before any campaign. Consent-based marketing requires Art. 6(1)(a) plus Czech electronic marketing requirements. |

No solely automated decisions producing legal or similarly significant effects found. Bot verification can refuse automated form submissions; email contact remains available. No sensitive-data collection intended.

## Legitimate-interest assessments (owner review required)

Business communication: interest is answering inquiries and managing follow-up. Processing contact details and correspondence is necessary to reply; restrict recipients and avoid unrelated marketing. Visitors reasonably expect a response, not indefinite CRM retention. Minimize optional fields, honor objections, review dormant inquiries, and retain beyond purpose only with a documented exception. Provisional balance favors limited correspondence processing; owner must approve this assessment and actual retention practice.

Security: interest is preventing spam, abuse and service interruption. Validation and throttling alone do not distinguish automated distributed submissions; Turnstile adds bot checks. Load it only when the configured contact form opens; do not use its signals for advertising. Restrict hostname/action, avoid recording tokens/content, use fixed outcome logs with 30-day retention, and offer email as an alternative. Consider impact of provider device signals and international processing, including children/vulnerable visitors; confirm necessity and provider settings before release. Reassess if a less intrusive measure offers adequate protection. This provisional balance is not proof that every vendor cookie qualifies for a storage exemption.

## Provider documentation versus account evidence

Reviewed official documentation on 17 October 2026:

| Provider | Public documentation establishes | Still requires account/contract evidence |
| --- | --- | --- |
| AWS | GDPR center describes customer region controls and contractual safeguards | Contracting entity, applicable DPA/SCC terms, actual region, support/subprocessor destinations, IAM, live log retention and host resources |
| Brevo | Storage article describes databases in France/Germany (OVH) and Belgium (Google Cloud), replicated backups; no basis to claim all processing is EU-only | Applicable DPA, subprocessor list and transfers/support access, transactional content/log expiry, backup deletion, leads list exclusion from campaigns, existing newsletter eligibility/automations |
| Cloudflare Turnstile | Current addendum describes IP/TLS/user-agent/sitekey signals and split processor/controller roles; global privacy policy describes transfers and US entity | Applicable DPA and transfer mechanism for actual service/entities, exact settings/cookies/pre-clearance, signal retention, necessity assessment |
| Website host / business mailbox / optional scheduler | Not identified from source; DNS/CDN appearances do not prove contracting entity or processing chain | Identify legal entities, services, country/region, terms/DPA, subprocessors, transfer mechanisms, access/query logs, retention, backups and scheduling provider if enabled |

The public policy attributes country statements to provider documentation and does not assert signed agreements, EU-only processing or implemented account safeguards. Its general host/mailbox references and transfer-mechanism explanation are not a substitute for completing Article 13 transparency. Before publication, identify those providers and add applicable actual destinations and safeguards (and means of obtaining a copy) to both languages. Do not treat the policy as finalized until this is done.

## Retention policy and manual enforcement

**Proposed default, awaiting business approval and first completed review:** inquiries not leading to cooperation: delete/anonymize within 12 months after last substantive communication. This number is intentionally NOT promised publicly yet. Public text uses purpose-based retention criteria. No cron or deletion automation was introduced and no historic data was deleted.

Owner: Jakub Heidtke. Schedule: first business day of each month, complete review within five business days. Set a recurring private calendar/task reminder before approving publication. Review all outstanding cases, not just contacts whose creation date is old: a reply can change the last substantive communication date; a delivery event or marketing open cannot. Use a restricted register outside this public repository, with case reference, last communication, classification, review/deletion due date, documented exception and next review, systems checked, completion date and owner. Do not put contact details or request exports in git.

1. Inventory current Brevo lists/attributes/transactional history, inbox/sent/archive/trash, shared mailboxes, exports, downloaded attachments, connected CRMs and backup locations. Include partially failed submissions and duplicates. Verify recipient/host settings, and disable marketing automations triggered by the leads list. Ordinary inquiries must never be sent campaigns merely because they are leads.
2. Classify active inquiries, closed non-converted inquiries, clients and legal holds. Use 12 calendar months from last substantive communication for closed non-converted cases after approval. At monthly review, identify cases falling due before next review and schedule deletion by their deadline; do not allow monthly batching to exceed a published 12-month deadline.
3. Search all inquiry copies by email/name/case identifiers, including full email threads and optional company/phone/campaign attributes. Delete the Brevo contact if solely an expired inquiry; if it has another valid purpose, clear expired inquiry attributes rather than deleting legitimate subscription/client evidence. Remove inquiry-only list memberships and provider message bodies/attachments where available. Preserve suppression records only with a documented separate purpose and minimum fields; do not reactivate subscribers.
4. Delete inbox/sent/archive/trash copies, local mail cache/exports and attachments under business control, including duplicates and forwarded copies. Ask relevant recipients/processors to erase or rectify where required. If provider logs/backups cannot be erased immediately, record actual expiry and access restrictions, request deletion where available and tell the requester accurately. Never promise deletion of a visitor's own confirmation copy.
5. Record completion with minimal evidence (case reference, systems, dates and exceptions, no message copies). Escalate inability to erase before a deadline to the owner immediately. For restoration, reapply outstanding deletions before restored data is used. Review exceptions monthly and remove holds when grounds end.
6. First review must reconcile legacy Brevo records, prior newsletter choices and all mailbox copies. Owner signs off that it is complete and reminder/access rights exist. Only then approve the 12-month policy and update both public translations and fixed update date. Do not claim an automatic deletion process.

| Category | Retention / enforcement |
| --- | --- |
| Non-converted inquiries | Proposed 12 months after last substantive communication, manual process above; approval and first run outstanding |
| Client/project communications | Relationship duration plus documented claim/obligation need; review exceptions monthly |
| Accounting/tax | Applicable document-specific statutory period. Owner/accountant must identify actual records and obligations; no universal period asserted. Do not retain an entire inquiry under an accounting label. |
| Application/API logs | 30 days explicitly configured in CDK; verify deployed settings. No payload/token logging. CloudWatch expiration is not a guarantee of instant physical purge. |
| Historical newsletter records | Until withdrawal or documented deletion criterion, subject to lawful minimum consent/suppression evidence; account audit required; new signup disabled |
| Campaign session storage | Tab session (may be browser-restored), or withdrawal; already submitted copies follow inquiry retention |
| Browser preferences | Until changed/cleared; no configured expiry |
| Provider delivery/security logs and backups | Actual periods unverified. Obtain exact expiry/deletion/support procedures and add to inventory before publication; no invented automatic deletion guarantee |

## Storage audit

| Key / technology | Provider / category | Behavior and actual lifetime |
| --- | --- | --- |
| `theme` localStorage | First party / requested appearance | Until changed/cleared, no expiry |
| `preferredLocale` localStorage | First party / explicitly selected language | Until changed/cleared, no expiry; explicit locale URLs take precedence |
| `plainlysmart.attribution-consent.v1` localStorage | First party / privacy choice | accepted/rejected; until changed/cleared, no expiry; unavailable storage fails closed |
| `plainlysmart.utm` sessionStorage | First party / optional campaign attribution | No capture before acceptance; legacy data cleared without acceptance. Session ends with tab session, subject to browser restore; withdrawal clears current tab memory and stored data; subsequent submissions in other tabs re-check shared consent. |
| Turnstile provider operations | Cloudflare / bot protection | Script only on configured form opening. Provider signals include IP/TLS/user-agent/origin. No application `cf_clearance` configuration. Check widget pre-clearance and real browser cookies; do not infer exemptions from a name. |

No general cookie banner added: no other optional tracker found; attribution already has equal accept/reject controls in footer. Verify production hosting scripts/cookies and Turnstile settings before releasing. Do not enable non-essential storage/scripts before consent. Query parameters reach the host as part of URLs even before attribution opt-in; verify host query logging/referrer behavior. Consent withdrawal does not retrospectively erase submitted data. A copied/restored browser session can retain sessionStorage; do not promise guaranteed erasure on closing a window.

## Access, erasure and consent requests

Receive at centralized privacy email. Owner records receipt, scope and deadline in restricted register. Verify identity proportionately without routinely requesting ID documents. Acknowledge without exposing whether another person has contacted the business. Normally respond within one month; if a lawful extension is necessary, notify within that first month with reasons (up to two additional months under Article 12(3)).

Locate Brevo contact attributes/list membership, email threads/sent/archive/trash, delivery history, exports and other business systems. Logs have no deliberate contact identifiers; do not add personal data merely to enable searching. Export only requester data in a suitable readable format, redact third-party data, and use secure delivery. For correction/restriction/objection/erasure/portability, assess conditions and specific legal exceptions; record reasoning, actions and necessary recipient notifications. Apply deletion procedure above to all relevant copies. Explain actual backups, legal holds and response/complaint options accurately. Stop consent-based use on withdrawal, preserve only justified minimal evidence/suppression, and avoid confusing an ordinary inquiry with subscription or re-consent. Forward provider-controller requests where appropriate. Never log request contents in Lambda or commit evidence to this repository.

## Publication blockers and owner checklist (unverified)

- [ ] Owner approves purposes, provisional balancing assessments and document-specific legal obligations; confirm rights mailbox is monitored.
- [ ] Approve retention policy, establish monthly reminder, complete first review and record evidence across Brevo/mailbox/backups. Only then publish the 12-month statement.
- [ ] Identify host/mailbox/optional scheduler; update both policies with actual provider information, countries, transfer safeguards and copy/access mechanism. Confirm AWS/Brevo/Cloudflare contract entities, applicable DPAs, SCCs/adequacy and supplementary measures; keep restricted evidence.
- [ ] Inspect deployed AWS retention and logging, host query/access logs, all provider retention/backup settings and Turnstile cookie/pre-clearance behavior. Source synthesis is not deployed-state evidence.
- [ ] Inspect Brevo leads list 3 / historical newsletter list 4 (prod source configuration); exclude leads from campaign eligibility/automations, audit legacy consent and suppression, arrange unsubscribe and deletion handling. Deploying code alone does not remove old memberships or stop provider automations.
- [ ] If newsletters are wanted later: separate unchecked opt-in with exact notice/version, timestamp/source/locale, auditable consent evidence, withdrawal/unsubscribe in every campaign and tested suppression. Consider double opt-in. Do not re-enable based on a boolean attribute alone.
- [ ] Confirm final release date and equivalent English/Czech provider/retention details; legal review of complete Article 13 notice. No deployment authorized by this task.

## References

- GDPR, especially Articles 5, 6, 12–22, 28 and 44–49: https://eur-lex.europa.eu/eli/reg/2016/679/oj
- Czech ÚOOÚ cookies guidance: https://uoou.gov.cz/verejnost/qa-otazky-a-odpovedi/cookies
- Czech electronic marketing rules and authority guidance: https://uoou.gov.cz/ (review applicable Act No. 480/2004 Sb. requirements before campaigns).
- AWS GDPR center: https://aws.amazon.com/compliance/gdpr-center/
- Brevo storage: https://help.brevo.com/hc/en-us/articles/360001005510-Data-storage-location
- Brevo GDPR/DPA information: https://help.brevo.com/hc/en-us/articles/360001258744-How-does-Brevo-comply-with-the-GDPR
- Cloudflare Turnstile roles/signals: https://www.cloudflare.com/turnstile-privacy-policy/
- Cloudflare international transfers: https://www.cloudflare.com/policies/privacy/

Public provider documentation supports the descriptions above, not a claim that this business has verified every applicable contract or account setting.

## Implementation inventory and validation

Modified files:

- `messages/en.json`, `messages/cs.json`: equivalent public legal sections, purposes/storage tables, rights and neutral availability; remove draft, guarantee and subscription copy.
- `src/app/[locale]/privacy/page.tsx`, `src/app/globals.css`: semantic policy layout, paragraphs/lists, responsive scrollable tables, localized legal link and shared controller configuration.
- `src/lib/business.ts`, `src/components/BusinessIdentity.tsx`: ARES-verified postcode/country and centralized identity rendering.
- `src/components/booking.tsx`: remove non-operational newsletter control; privacy disclosure and inquiry validation retained.
- `src/components/home/AvailabilityPanel.tsx`, `ProcessSection.tsx`: remove unsupported scarcity/guarantee; delete unused capacity constant file `src/lib/booking.ts`.
- `infra/lambda/validation.ts`, `services.ts`, `handler.ts`: ignore legacy newsletter opt-in; leads-only contact upsert, preserve historical consent/suppression, remove misleading consent field from notification.
- `tests/compliance.spec.ts`, `tests/booking.spec.ts`, `infra/tests/handler.test.ts`: policy/identity/metadata/no-draft/table/rights coverage; no newsletter signup; opt-in/rejection/withdrawal attribution; sanitized invalid-request logs.
- `docs/compliance.md`, `README.md`, `infra/README.md`: verified/unverified audit, manual retention and rights runbooks, disabled newsletter setup and accurate test instructions.

Validation on 17 October 2026:

- Root and infra `npm run typecheck`: passed.
- Root `npm run build`: passed; static export includes both locales' privacy/legal pages and sitemap. Used existing production public configuration; tests intercept provider/API requests, no real form submission.
- Infra `npm test`: 35 passed, zero skipped. After extending the log assertion, `npx tsx --test tests/handler.test.ts`: 26 passed, zero skipped.
- `npm run synth -- PlainlySmartContact -c stage=prod`: passed locally. No CDK resource definitions, names, IAM permissions or recurring service costs changed; only Lambda bundle behavior changes on a future authorized deployment. Existing log groups retain DESTROY removal policy; deleting/replacing the stack can delete logs.
- Root `npm run lint`: blocked before analysis by existing TypeScript 7.0.2 / typescript-eslint incompatibility. No dependencies changed to conceal this limitation.
- `git diff --check`: passed.
- Browser coverage includes 360/1440px privacy layout, theme, keyboard, locale, SEO, mocked contact success/failure, attribution rejection/withdrawal and no subscription. Mobile dark policy screenshot inspected. Sandbox Windows user/process limitations required mocked backend tests and final browser run outside sandbox; no provider mutation or deployment.
- Final root `npm test`: **70 passed, zero skipped**, against the fresh production static export (44.9 seconds).

Release coordination (updated by the contact regression review): cached requests with marketingConsent=true are now accepted for inquiry processing and the field is ignored; no newsletter subscription occurs on the updated backend. Updated frontend requests also satisfy the old Lambda validator. Backend-first is recommended to disable legacy signup behavior immediately when a release is authorized; either order preserves transactional contact delivery. Existing deployed behavior is unchanged until deployment. See docs/contact-regression-review.md for the compatibility matrix and evidence.

Owner instruction after the audit: restore the client availability panel with CLIENT_CAPACITY = 2. This supersedes the earlier neutral-availability change and removal of src/lib/booking.ts; the capacity value is now explicitly supplied by the owner.

Contact regression follow-up: the cached-form HTTP 400 issue was fixed by validating and ignoring the optional legacy boolean, not by re-enabling newsletter signup. See [contact-regression-review.md](contact-regression-review.md) for independent deployment compatibility, exact transactional assertions and current validation results.
