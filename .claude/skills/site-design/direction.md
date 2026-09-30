# Site direction (binding; revised 2026-09-26 by the user's pick in SN-036)

Reason: the user picked SN-036 "Итог · A+D" over SN-034. Mockup: https://claude.ai/artifact/TgJykR7fPrccNiJu2RHsrW, source `.claude/tasks/design/SN-036/notes/mockups/index.html` (`.F` rules).

## Brief
- Sofija Ivanova: nutrition specialist in Riga, doctoral researcher on diabetes and CGM (not "Dr." until the defence; title "uztura speciāliste" vs "sertificēta dietoloģe" pending her confirmation).
- Visitors: adults concerned about weight, energy, glucose or digestion, in LV, RU or EN, on phone and desktop.
- They must first see that she is formally qualified and does research (education, doctorate, register), then get their questions answered in order, and book without hunting. The practice is for everyone, not only glucose or diabetes (user, 2026-09-28).

## Palette
| Name | Hex | Role | Contrast on White |
|---|---|---|---|
| White | #FFFFFF | the only page background | - |
| Graphite | #1E2530 | body text and headings | 15.4:1 |
| Slate | #52607A | secondary text, index links | 6.3:1 |
| Navy | #002D74 | action accent only: primary buttons (hover #001F52), selected slot/format, chart line B | 12.9:1 |
| Range | #2E7D5B | chart in-range band and line A, active index marker, step numbers | 5.0:1 |
| High | #B06A00 | chart segment above range only | graphic |

Mist #F1F4F9 is the one panel tint (booking summary); Line #DDE3EC the only hairline (1.3:1, dividers only). SN-033 (forms, admin): field borders Slate (WCAG 1.4.11); Error #B42318 (6.6:1) for field errors and destructive actions only; admin booking status is an icon or 3px left border, never a fill, label Graphite: confirmed Range, pending High, cancelled Error. Admin calendar (SN-041, no rule covered day states): bookable White, non-bookable Mist, reason as Slate text. Navy stays scarce (user, 2026-09-26): never for text, headings, fills or section backgrounds. No dark sections, no gradients, no shadows.

## Type
- Geologica only: 300 for H1 with the key phrase in 600; 400 body and H2; 600 buttons, labels, strong. Tabular figures in the chart and calendar.
- Scale (desktop / phone): H1 clamp(34px, 24px + 2.2vw, 46px) lh 1.1, balanced (SN-051); H2 30/24 lh 1.2; H3 20/18 lh 1.3 at 600; prose `p` 18/17 lh 1.6; UI text 16; small 15; chart labels 11-13. (SN-038: H3 and UI text were unset.)
- Sentence case. No eyebrows, no uppercase labels.

## Layout
- Header: no mark. Desktop: the name "Sofija Ivanova" (Geologica 600) over the credentials title "Sertificēta uztura speciāliste, pētniece, doktorante" (Slate), three links, LV RU EN, one Navy button. Phone: no burger; links and button hide, and a 44px portrait crop joins the name (photo logo; "Dr." badge cropped out; replace after the shoot); LV RU EN stay at every width; "Pacienta kabinets" moves to the footer. Sticky on desktop, static on phone; nothing hides on scroll.
- Locales (SN-016): LV `/`, RU `/ru/`, EN `/en/`, one layout; LV RU EN are links, current `aria-current="page"`.
- Hero (7fr/5fr from 1024px, one column below: SN-051, 6-line H1 at 768): thesis headline, lead, button, one format line; on the right a typographic "education and research" panel (degree, doctorate, project, register number once; the title is already in the header, not repeated). No photo in the hero: the current photos are not good enough to build on (user, 2026-09-28).
- Body (4fr/8fr): sticky question index (scrollspy, Range marker) beside six questions: fit (rows + "see your doctor first" boundary), first consultation (4 real steps, numbered), price (table; each price stated once), who is Sofija (EASD photo, research, talks, the glucose chart; credentials stay in the hero), how the approach differs (plate model with its source, then how it is individualised), how to book. One figure per question: the glucose chart in "what Sofija researches", the plate in "how it differs". Price rows without a number are not shown.
- Booking: format toggle, A's week grid (Mon-first, Europe/Riga), summary panel with one button. Footer minimal.
- Container 1160px, 40px/20px side padding; sections split by a Line border, not fills. Radius 4px on buttons, slots, panels; photos square. Phone: single column, index static above the questions.

## The one motion moment
The index marker moving to the current question (200ms ease-out colour/border); smooth scroll on index clicks. Both off under `prefers-reduced-motion`. Nothing else animates.

## The glucose-curve figure
In "what Sofija researches" (Q4) only, as an example of her field (moved out of the hero 2026-09-28): AGP-style chart, same breakfast, two people, 07:00-11:00, monotone curves, real units. Green range 3.9-7.8 mmol/L (post-meal normal without diabetes; caption wording for Sofija to approve). Above 7.8 drawn in High. Labelled illustrative/synthetic. Pointer and arrow keys show values.

## References
`.claude/tasks/design/SN-036/notes/references.md` (~30 sites, what was taken).
