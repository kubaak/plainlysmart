<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Repository guidance

The frontend is a bilingual English/Czech static export; the separate `infra/` npm package implements the contact API. Root TypeScript checks exclude `infra/`, so validate backend changes with that package's commands too. Public frontend configuration is baked into the export. Never put backend secrets in `NEXT_PUBLIC_` variables.

Use only the repository skills relevant to the task (paths are relative to this root):

- [frontend](.codex/skills/frontend/SKILL.md): page design, components, English/Czech content, locale and theme behavior.
- [contact](.codex/skills/contact/SKILL.md): consultation dialog, contact payload, Turnstile, validation and Brevo delivery.
- [infra](.codex/skills/infra/SKILL.md): CDK resources, configuration, synthesis and infrastructure review.
- [verify](.codex/skills/verify/SKILL.md): reproducing failures and choosing local build, browser and backend checks.

AWS shares an account with other projects. Preserve Plainlysmart resource boundaries and naming; local validation does not authorize deployment or changes to unrelated resources.
