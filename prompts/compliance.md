Implement the legal and GDPR compliance requirements for the PlainlySmart website (plainlysmart.com), targeting Czech and EU regulations.

## 1. Inspect the existing project

Before making changes:

- Review the Next.js application structure, routing, localization (`next-intl`), shared layout, footer, and contact form.
- Inspect existing dependencies, analytics, third-party scripts, cookies, localStorage, and sessionStorage usage.
- Review the AWS CDK infrastructure, Lambda contact endpoint, CloudWatch logging, Brevo integration, and Cloudflare Turnstile integration.
- Follow existing architecture, styling, component conventions, and testing patterns.
- Preserve static export compatibility (`output: "export"`).
- Do not introduce unnecessary dependencies.

## 2. Privacy Policy

Create a dedicated Privacy Policy page in both English and Czech using the existing localization infrastructure.

Requirements:

- Follow the current localized routing conventions.
- Match the existing website design and typography.
- Make the content accessible, responsive, and SEO-friendly.
- Include an effective date and last-updated date.
- Use structured sections with clear headings.

Cover the following topics:

1. Identity and contact details of the data controller.
2. Personal data collected through the contact form (name, email, optional phone number, message).
3. Technical information processed for security and spam prevention.
4. Purposes and applicable GDPR legal bases for processing.
5. Data processors and third-party services, including AWS, Brevo, and Cloudflare Turnstile, where applicable.
6. International data transfers and applicable safeguards, without inventing guarantees.
7. Data retention periods.
8. Data subject rights under GDPR.
9. Right to lodge a complaint with the Czech Data Protection Authority (ÚOOÚ).
10. Contact details for privacy-related requests.
11. Cookies and similar technologies actually used by the website.
12. How changes to the Privacy Policy are communicated.

Use configurable placeholders for legal information that has not yet been supplied:

- Legal business name
- IČO
- Registered business address
- Relevant business registry information
- Privacy contact email (default to info@plainlysmart.com)

Do not invent legal identity information, retention periods, or unverified statements about third-party processing.

## 3. Business identification and footer

Update the existing footer to display the legally relevant business information.

Include:

- PlainlySmart brand name.
- Legal business name.
- IČO.
- Registered business address.
- Registry information, where applicable.
- Contact email.
- Link to the Privacy Policy.
- Copyright notice with the current year.

Support English and Czech localization.

Keep the footer visually clean. Do not significantly change the current design.

Use a centralized configuration for business identity information to avoid duplication.

## 4. Contact form privacy disclosure

Update the existing contact form.

Add a short privacy disclosure immediately below the submit button.

English:

"We'll use your information to respond to your inquiry. Learn more in our Privacy Policy."

Czech:

"Vaše údaje použijeme k vyřízení vašeho dotazu. Více informací najdete v našich Zásadách ochrany osobních údajů."

Requirements:

- Link directly to the correctly localized Privacy Policy.
- Use existing typography and link components.
- Ensure the notice is accessible.
- Do not add a mandatory GDPR consent checkbox solely for responding to contact inquiries.
- Do not change the existing form submission behavior.

## 5. Cookie and tracking audit

Inspect the entire frontend for:

- Cookies.
- localStorage and sessionStorage.
- Analytics scripts.
- Marketing pixels.
- Third-party embeds.
- Cloudflare Turnstile.
- Other technologies that access or store information on visitors' devices.

Document the findings.

Do not automatically implement a cookie banner.

If the website uses only strictly necessary technologies, document why a consent banner is not currently required, subject to legal verification.

If non-essential tracking is present:

- Identify the specific technologies.
- Implement appropriate consent management before loading them.
- Support accepting and rejecting non-essential tracking equally easily.
- Allow users to change their preferences later.
- Ensure scripts do not execute before the required consent.

Do not introduce analytics or tracking services.

## 6. AWS backend privacy and security

Review the existing AWS CDK infrastructure and contact form Lambda.

Verify:

- HTTPS is enforced.
- Sensitive information is not unnecessarily written to CloudWatch.
- Contact form message bodies, email addresses, phone numbers, and Turnstile tokens are not logged by default.
- CloudWatch log groups have explicit, reasonable retention settings.
- Secrets are stored securely and not exposed through logs or frontend code.
- IAM permissions follow least-privilege principles.
- Error responses do not expose internal implementation details.
- Existing spam protection and rate limiting remain functional.

Implement safe improvements where appropriate.

Avoid introducing paid AWS services or infrastructure with meaningful additional costs without explicitly documenting and requesting approval.

Preserve the current CDK stack names, resource prefixes, and deployment configuration.

## 7. Data retention and processors

Create a concise internal compliance document under `docs/compliance.md`.

Document:

- Personal data collected.
- Processing purposes and legal bases requiring confirmation.
- Data flow from frontend to API Gateway, Lambda, Brevo, and email inbox.
- AWS, Brevo, and Cloudflare roles as applicable.
- Data retention policies requiring a business decision.
- Relevant data processing agreements and transfer safeguards requiring verification.
- Procedure for handling data access and deletion requests.
- Cookie audit findings.
- Outstanding legal questions and configuration placeholders.

Do not present assumptions as verified facts.

## 8. Accessibility and SEO

Ensure:

- Privacy Policy pages have correct page titles and descriptions.
- Localized routes have appropriate metadata.
- Privacy Policy links are keyboard accessible.
- Headings follow a logical hierarchy.
- Existing sitemap generation includes the legal pages.
- Pages remain compatible with static export.
- Layout works on mobile and desktop.

Review basic accessibility requirements without claiming full WCAG or European Accessibility Act compliance from an automated audit.

## 9. Testing

Add or update tests following the existing test conventions.

Cover:

- Privacy Policy pages in both languages.
- Footer legal information and links.
- Contact form privacy disclosure.
- Correct localized navigation.
- Static export/build.
- Cookie consent behavior, only if consent management is required.
- Relevant Lambda logging and infrastructure changes.

Run linting, type checking, tests, and production build.

Fix regressions introduced by the changes.

## 10. Deliverables

After implementation, provide:

1. Summary of changes.
2. List of modified and added files.
3. Results of tests and build.
4. Cookie and tracking audit findings.
5. AWS infrastructure changes and any deployment implications.
6. A checklist of legal information I still need to provide.
7. Any compliance decisions that require legal review.

Important constraints:

- Do not redesign the website.
- Do not add a cookie banner unless necessary.
- Do not add unnecessary consent checkboxes.
- Do not invent business identity information.
- Do not introduce new paid services.
- Do not deploy infrastructure automatically.
- Keep the implementation simple, maintainable, and appropriate for a small Czech software development business.
- Clearly distinguish implemented technical controls from legal matters requiring human verification.
