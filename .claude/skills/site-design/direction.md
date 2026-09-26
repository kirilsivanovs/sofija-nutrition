# Site direction (binding; revised 2026-09-26 by the user's pick in SN-036)

Reason for revision: the user picked SN-036 "Итог · A+D" (base A, questions from D; photo logo on phone only) over the SN-034 Lora/Inter direction, which they judged AI-generic. Mockup: https://claude.ai/artifact/TgJykR7fPrccNiJu2RHsrW, source `.claude/tasks/design/SN-036/notes/mockups/index.html` (`.F` rules).

## Brief
- Sofija Ivanova: nutrition specialist in Riga, doctoral researcher on diabetes and CGM (not "Dr." until the defence; title "uztura speciāliste" vs "sertificēta dietoloģe" pending her confirmation).
- Visitors: adults concerned about weight, energy, glucose or digestion, in LV, RU or EN, on phone and desktop.
- They must see why individual advice matters (the chart), get their questions answered in order, and book without hunting.

## Palette
| Name | Hex | Role | Contrast on White |
|---|---|---|---|
| White | #FFFFFF | the only page background | - |
| Graphite | #1E2530 | body text and headings | 15.4:1 |
| Slate | #52607A | secondary text, index links | 6.3:1 |
| Navy | #002D74 | action accent only: primary buttons (hover #001F52), selected slot/format, chart line B | 12.9:1 |
| Range | #2E7D5B | chart in-range band and line A, active index marker, step numbers | 5.0:1 |
| High | #B06A00 | chart segment above range only | graphic |

Mist #F1F4F9 is the one panel tint (booking summary); Line #DDE3EC the only hairline. Navy stays scarce (user, 2026-09-26: "too much of it everywhere"): never for text, headings, fills or section backgrounds. No dark sections, no gradients, no shadows.

## Type
- Geologica only: 300 for H1 with the key phrase in 600; 400 body and H2; 600 buttons, labels, strong. Tabular figures in the chart and calendar.
- Scale (desktop / phone): H1 46/34 lh 1.1; question H2 30/24 lh 1.2; body 18/17 lh 1.6; small 15, chart labels 11-13.
- Sentence case. No eyebrows, no uppercase labels.

## Layout
- Header: no mark. Desktop: the name "Sofija Ivanova" (Geologica 600) over "uztura speciāliste, Rīga" (Slate), three links, LV RU EN, one Navy button. Phone: no burger; links and button hide, and a 44px portrait crop joins the name (photo logo; "Dr." badge cropped out; replace after the shoot).
- Hero (5fr/7fr): thesis headline, lead, button, one format line; the glucose chart on the right.
- Body (4fr/8fr): sticky question index (scrollspy, Range marker) beside six questions: fit (rows + "see your doctor first" boundary), first consultation (4 real steps, numbered), price (table; each price stated once), who is Sofija (EASD photo, research, talks, credentials, register number once), how the approach differs, how to book.
- Booking: format toggle, A's week grid (Mon-first, Europe/Riga), summary panel with one button. Footer minimal.
- Container 1160px, 40px/20px side padding; sections split by a Line border, not fills. Radius 4px on buttons, slots, panels; photos square. Phone: single column, index static above the questions.

## The one motion moment
The index marker moving to the current question (200ms ease-out colour/border); smooth scroll on index clicks. Both off under `prefers-reduced-motion`. Nothing else animates.

## The glucose-curve figure
Hero only: AGP-style chart, same breakfast, two people, 07:00-11:00, monotone curves, real units. Green range 3.9-7.8 mmol/L (normal post-meal for people without diabetes; user's choice, caption wording for Sofija to approve). Above 7.8 drawn in High. Labelled illustrative/synthetic. Pointer and arrow keys show values.

## References
`.claude/tasks/design/SN-036/notes/references.md` (~30 sites; what was taken per site).
