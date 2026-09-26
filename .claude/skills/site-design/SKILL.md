---
name: site-design
description: Visual and content rules for the public site, booking flow, cabinet and admin — how to keep the design specific to Sofija's practice rather than a generic AI landing page, plus accessibility (WCAG 2.1 AA), performance and i18n requirements. Use for any frontend task that changes layout, styles, components, images or copy.
---

# Site design

## How to design

Adapted from Anthropic's `frontend-design` skill (`anthropics/claude-code` plugin, `plugins/frontend-design/skills/frontend-design/SKILL.md`, read 2026-09-25).

1. **Ground first.** Read Sofija's practice (this file, `direction.md` once it exists) and the task's brief before touching any styling.
2. **Direction as a compact system.** 4–6 named hex values drawn from her subject — derive from `src/styles/fresh-clinical.css` tokens where they already exist, never a stock palette. 1–2 type families covering Latvian diacritics and Cyrillic, with the weights actually used. One type scale. Line length ≤ 80ch (`max-width: 70ch` on prose). The page grid. One deliberate motion moment, not scattered transitions.
3. **Critique the draft** against the brief and the Never list below; replace whatever is a default rather than a deliberate choice.
4. **Look at the rendered page and refine** — a screenshot beats imagining the layout.

`.claude/skills/site-design/direction.md`, once `designer` has written it, is the binding site-wide direction: follow it instead of re-deciding per task.

The site must read as one real practitioner's practice: a nutritionist in Riga who does research on diabetes and continuous glucose monitoring (CGM). The audit of 2026-09-25 found the current landing to be a recoloured template. Every UI change moves away from that, never back towards it.

**Quality bar.** Every option, mockup or shipped page should read as if it took a large, senior design team years of attention to every button, line of copy and spacing decision — not as "a competent generative pass". Reject the generic look any vibe-coding tool produces by default (interchangeable templates, the same safe type pairing, decoration for its own sake) even when it is polished; distinctness and restraint matter more than density of detail. Each option in a set of directions must differ in more than colour — type pairing, a signature structural device, content shape.

**Rendered mockups.** When a task calls for something the user can see and pick between (not text wireframes), build it as a Claude Artifact and follow Anthropic's own `artifact-design` guidance (loaded via the `Artifact` tool's `quickstart`) for the page contract, theming and CDN rules — this is the recommended tool for this, not a hand-rolled static HTML file served locally. Real project photos only, inlined as they must be for the Artifact sandbox; no invented copy, prices or credentials even as placeholders — mark them. Proven shape (SN-036): one Artifact, one tab per option, a spec panel per option (palette with hex and contrast, type, signature device, what changes, risk, cost, logo consequence), a "notes" toggle that shows designer notes and underlines proposed copy, a "phone" toggle (option CSS written with `@container`, so 390 px renders truthfully), synthetic data labelled as such. Source and photos live in the task's `notes/mockups/`; check it in the browser at desktop and phone width before publishing.

## Standing feedback from the user

What the user has asked for across SN-014, SN-033, SN-034 and SN-036. It binds every design task until they say otherwise.

- **Light pages only.** No dark hero, no dark or saturated full-bleed sections, no dark-first look.
- **No "infocigane" look.** No staged guru photos, gold, marble or luxury props, lifestyle flat-lays, or salesy funnels. Funnel signs: free-guide eyebrows, stat rows ("10 000+ klientu", "4.9★"), strikethrough or teaser prices, logo walls, countdowns, "as featured in".
- **No vibe-coder template.** It must not look like anything a generator stamps out. That includes the hero + 3 cards + testimonials + CTA band skeleton, the safe font pairs, and decoration that only exists to look designed. Polish does not excuse sameness.
- **Options differ in substance.** Offer 3–4 options. Each has its own palette, type pair, signature structural device, block set and content shape; a recolour is not an option. Say for each what it drops and what it risks.
- **Show, don't describe.** Options the user picks from are rendered (see *Rendered mockups*). Text wireframes alone were rejected (SN-034).
- **Fonts already rejected** as generic in SN-034: Lora + Inter, IBM Plex Sans/Mono, Fraunces + Public Sans, PT Serif/Sans, Source Sans 3. Also never Inter, Poppins or Space Grotesk as a lead face. Don't re-offer these; every new family must have Latvian diacritics and Cyrillic.
- **Subtract.** Removing chrome was welcome (SN-014): hover lift, shadows, gradients, blur, icon squares. Cut before you add.
- **No logo mark.** The user dropped the graphic mark (SN-033/SN-036). The desktop header is the name and specialty in the site font. On phone there is no burger, and a small portrait crop joins the name. Don't propose a logo again unless asked.
- **No burger menu.** A one-page site navigates by its question index; hiding three links behind a burger was rejected as a template move (SN-036).
- **Photos until the shoot.** No photoshoot has happened yet. The existing generated photos of Sofija (consultation room, cut-out portrait) may be used, Gemini watermark included (user, 2026-09-26). Mark each "replace after the shoot". Crop above the coat's "Dr." badge; if the crop can't hide it, flag it. Still excluded: the CGM-sensor photo (`doctor-puts-sensor`, dropped by the user in SN-036 as too weak), `healthy-food-cgm` (gold and marble), `hero-nutritionist*` (fake lab, "Dr."), `doctor-analyzing-cgm` (luxury props).
- **Design runs on Opus.** Design research and mockups are done on Opus, in the main session when the user asks. A Sonnet pass was rejected as generic.
- **Accent colour stays scarce.** Navy #002D74 replaced black at first, then read as "too much everywhere" (SN-036). An accent is for action and selection only (buttons, selected state, one chart line). Text stays neutral graphite, and no accent fills.
- **Healthy-person glucose range.** The chart's green band is 3.9–7.8 mmol/L, the post-meal normal for people without diabetes. 10 is the diabetes target and reads as the wrong audience (user, SN-036).
- **Latvian first.** Copy in mockups is Latvian, from the live site or Sofija. Anything proposed is marked. Flag title mismatches rather than choosing: the site says "sertificēta dietoloģe", her own slides say "uztura speciāliste".

## What makes it specific

- **Real photographs only.** Sofija, her room, her food, her talks (EASD 2025 Vienna, Researchers' Night, Health Literacy Day at Stradiņš hospital — already in `public/assets/img/*-600w.webp`). Never an AI-generated image of any subject (people, food, devices, backgrounds), never a "doctor" stock photo; a section without a real photo goes without an image (the one interim exception is *Photos until the shoot* above), never a title she does not hold (no "Dr." before the doctorate is defended).
- **Her subject as the visual language.** Glucose curves, time-in-range bands (3.9–7.8 mmol/L, see *Standing feedback*), before/after meal comparisons with anonymised data, real units. Use it in one place per page, drawn to scale, not as decoration everywhere.
- **Her words.** Copy comes from Sofija, first person, concrete: "First consultation: 60 minutes, online or in Riga, from 65 €". If a task has no copy, use a clearly marked placeholder and log `copy pending from Sofija`; never write health promises.
- **Readable column with asymmetry** over card grids: a readable column, deliberate asymmetry, long paragraphs where something needs explaining — not the cream-background-plus-high-contrast-serif look that a "readable, editorial" brief defaults to. A card is used only when the item is genuinely a separate object (a service with a price).

## Never

- Gradient blobs, decorative rings/dots, glassmorphism, floating or bobbing elements, infinite animations.
- A pill badge above every heading; rows of 3 or 6 identical icon-in-a-tinted-square cards; emoji as section markers.
- The same fact (price, credentials) repeated in several sections.
- Stock phrases: "your journey to better health", "transform", "no yo-yo effect", "nutrition that works for you", "Gatavi sākt ceļu uz…".
- Hover lift + soft shadow on every card; `rounded-2xl` on everything; identical rounded shadow cards throughout a page.
- Eyebrow labels, all-caps labels, a single italic or bold word standing alone in a headline.
- `01` / `02` / `03` numeric markers unless the items are genuinely sequential steps.
- Monospace labels used as a decorative device everywhere.
- Scattered hover transitions with no single orchestrated motion moment.
- A stock palette — including cream + terracotta, or cream background with a high-contrast serif headline — instead of the 4–6 named hex values drawn from Sofija's own subject and tokens.
- Decoration that does not serve the brief: cut it rather than keep it "because it looks designed".

## Tokens and styles

- One CSS system. New styles go into the token-based system the task's plan names (currently `src/styles/fresh-clinical.css` + Tailwind via Vite); don't add to `public/assets/booking.css` or `tailwind-custom.css` (legacy, to be removed), and don't add inline `<style>` blocks to pages.
- Colours from tokens only. Text on the sage accent uses `--color-sage-deep` (≈6:1); plain `#5b8c6e` fails AA for body-size text.
- Fonts must cover Latvian diacritics (ā č ē ģ ī ķ ļ ņ š ū ž) and Cyrillic. At most two families, loaded with the weights actually used.
- Icons: self-hosted SVG or one pinned icon weight; never an unpinned CDN script.

## Accessibility (WCAG 2.1 AA) — every UI task

- Contrast ≥ 4.5:1 for text, ≥ 3:1 for large text and UI boundaries.
- Everything operable by keyboard with a visible focus state; the booking calendar uses buttons (or a grid with roving tabindex), `aria-selected`, arrow-key navigation.
- Every input has a linked `<label for>`, `autocomplete` where it applies, errors announced (`aria-describedby`, `aria-live`).
- Dialogs: `role="dialog"`, `aria-modal`, focus moved in and restored on close, Escape closes.
- `prefers-reduced-motion` respected; content visible without JavaScript (no `opacity: 0` until a script runs).
- Tested at 375 px wide and at 200 % zoom.

## Performance

- Images: WebP/AVIF with `srcset` and explicit `width`/`height`; nothing over ~300 KB shipped; unused originals don't live in `public/`.
- Hashed asset names (Astro's build) for anything cached long-term; `public/` files with a fixed name must not be cached `immutable`.
- No new third-party script without a pinned version, SRI, and a CSP entry justified in the plan.

## Languages

- Latvian is the default; Russian and English are full versions, not partial. Every new string gets all three keys in `shared/translations.js` (or the per-locale route, once `/ru/` and `/en/` exist).
- Legal pages, error messages, `aria-label`s and emails are translated too.
- Weeks start on Monday; dates and times in Europe/Riga, formatted per locale.
