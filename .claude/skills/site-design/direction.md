# Site direction (binding; written 2026-09-26)

## Brief
- Sofija Ivanova: certified dietitian in Riga, doctoral researcher on diabetes and CGM (not "Dr." until the defence).
- Visitors: adults concerned about weight, energy, glucose or diabetes, reading in LV, RU or EN, on phone and desktop.
- They must feel they are reading one researcher-clinician's own page, and book a first consultation without hunting.

## Palette (all from `src/styles/fresh-clinical.css`)
| Name | Hex | Token | Role | Contrast on Paper |
|---|---|---|---|---|
| Paper | #fffdfa | `--color-bg-light` | the only page/section background | - |
| Ink | #1f2937 | `--color-ink` | body text | 14.4:1 |
| Slate | #6b7280 | `--color-text-light` | secondary text, input borders | 4.8:1 (fails 4.5 on Cream: 4.49) |
| Forest | #1b4332 | `--color-primary` | headings, primary button fill (Paper text 10.9:1) | 10.9:1 |
| Range | #2f6b46 | `--color-sage-deep` | links, the one in-range label | 6.2:1 |
| Band | #4f8f68 | `--color-sage` | time-in-range band and trace in the figure only | 3.8:1 (graphic) |

Rule #e5e7eb (`--color-border`) is the only hairline. Retired from web UI: Cream as section fill, gold `--color-secondary*` (keep only inside `logo.svg`; white on gold is 2.4:1), all gradients.

## Type
- Lora 500 for H1-H3 only; Inter 400 body, Inter 600 for buttons, labels, strong. Cut the other loaded weights when their last use goes.
- Scale (desktop / 375px): H1 44/34px lh 1.1; H2 30/26 lh 1.2; H3 21/19 lh 1.3; body 18/17 lh 1.6; small 15px.
- Sentence case everywhere. No `text-transform: uppercase`, no letter-spaced labels, no eyebrow above headings.

## Grid and measure
- Container 1200px, 12 columns, 24px gutter; 20px side padding at 375px.
- Prose max 68ch. Explanatory sections: heading in columns 1-4, text in 6-12 (asymmetric), stacking on mobile; FAQ and booking run one centred 8-column block, so the split is not a repeated template.
- Sections separated by 96px / 64px space and a Rule top border, never by alternating fills.
- Radius: 8px (`--radius-sm`) for buttons, inputs, service cards, calendar; 12px (`--radius-md`) for dialogs and the mobile menu only. Photos square-cornered. No pills.
- Shadow only on what floats above the page: dialogs, mobile menu, the booking popover.
- Cards only for things that are separate objects with a price (services). Lists stay lists.

## The one motion moment
State changes only, one timing: 200ms ease-out, for the FAQ answer reveal and the mobile menu opening. Hover is an instant colour or border change. No load, scroll, parallax, stagger or progress-bar motion. All motion off under `prefers-reduced-motion`.

## The glucose-curve figure
One inline SVG on the landing, in the research/about section beside her CGM doctoral work: a 24h trace, Band shaded 3.9-10 mmol/L at 15% opacity, real axes (mmol/L, hours), labelled illustrative/synthetic, caption from Sofija (placeholder until she sends it). Nowhere else as decoration.

## References (screenshots local in `.claude/tasks/design/_references/`)
- ourworldindata.org/diabetes - take: charts drawn to scale with source lines, flat panels, one accent. Avoid: dense chrome, all-caps sidebar labels.
- nutritionsource.hsph.harvard.edu (carbohydrates and blood sugar) - take: plain reading column with a side list, square photo inset in the text, flat white page. Avoid: clip-art plate graphic, red-on-white headings.
- quantamagazine.org/biology - take: serif headline + sans body, hairline column divider, image-left/text-right asymmetry. Avoid: spaced all-caps kicker above every title.
- realfood-matters.net (independent CGM clinician) - take: the practitioner's real portrait carries the page. Avoid: entry pop-up, script logo, cramped two-line nav.
