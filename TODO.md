# CCNL Website — Design Audit Fix List

Findings from the full-site design review (17 pages, desktop + narrow widths).
Each item is verified in the browser after the fix — not just "code changed".

Legend: `[ ]` todo · `[x]` done & verified in browser · `[~]` in progress

---

## Phase 1 — Homepage hero (the flagged issues)

- [x] **1.1** Network canvas sits 62px lower than the H1 and its bottom edge is flush with
  the hero divider (canvas 200→800, hero 0→800), so the graph is clipped mid-figure.
  Fix: reduce `mt-28` / canvas height so the figure is optically centred on the headline
  block with clearance above the section border.
- [x] **1.10** Follow-up: even after 1.1 the hero was 925px tall regardless of viewport, so
  on a normal laptop (inner height ~760px) the figure was cut off by 46px and its caption
  sat below the fold. The height is driven by the **text** column (~710px), not the canvas,
  so shrinking only the figure could not fix it. Both columns now scale with viewport
  height via `clamp()` (headline size, vertical rhythm, figure size), all clamped to the
  original desktop values at the top end. Verified 1024×640 → 1920×1080: hero fits the
  first screen and the figure + caption are fully visible at every size. The caption is
  also bounded to the figure width so it wraps instead of spilling out.
- [x] **1.2** Canvas overlaps / bleeds into the metrics row (stray nodes visible in the
  whitespace beside "300+ / 25+ / 7").
- [x] **1.3** Canvas right edge is flush with the container (1430) while the text column
  keeps a 64px margin — graphic reads as falling off the page.
- [x] **1.4** Metrics row bottoms out 2.7px above the section border — no bottom padding.
- [x] **1.5** H1 starts at x=99 while eyebrow, paragraph and metrics all start at x=64.
  Move the crimson rule into the gutter so the headline aligns with its own column.
- [x] **1.6** Counters animate 0→300 over 2s, so the hero loads reading "0+ Publications,
  0+ Years Active". `7 Research Areas` never animates. Make behaviour consistent.
- [x] **1.7** Network caption overlaps the nodes and overflows off-screen at narrow widths
  (`isMobile` in `js/brain-visualization.js:149` is decided once at construction and never
  re-evaluated on resize).
- [x] **1.8** Hero CTA underlines hug the text on desktop but stretch full-width on narrow.
- [ ] **1.9** UniPD lockup mixes serif + mono; the seal is illegible at 56px.

## Phase 2 — Content contradictions

- [x] **2.1** Publication count: `300+` (index) vs `200+` (research.html).
- [x] **2.2** Metric labels: Publications/Years Active/Research Areas vs Papers/Years/Areas.
- [x] **2.3** Founding year: "EST. 2000" / "October 2000" vs "Founded the CCNL in 2001"
  (people.html, profile.html).
- [x] **2.4** Research areas: 7 (research.html) vs 6 (join-us.html), differently named.
- [x] **2.5** Zorzi's title: "Full Professor · Principal Investigator" vs "Lab Director ·
  Full Professor".
- [x] **2.6** Address: Via Venezia 8 (footer/contact) vs via Venezia 12/2 (profile).
- [ ] **2.7** Contact email: info@ccnl.psy.unipd.it vs marco.zorzi@unipd.it.
- [x] **2.8** "modelling" vs "modeling" — both appear on people.html.
- [x] **2.9** Sina Shafiezadeh & Michele De Filippo De Grazia listed as Key Researchers on
  research-ai.html but absent from people.html.
- [x] **2.10** `<title>` split three ways; contact.html has no page name at all.

## Phase 3 — Navigation & footer

- [x] **3.1** Footer "Quick Links" has 5 different versions across the site. Unify.
- [x] **3.2** "Join us" (nav) vs "Join Us" (footer).
- [x] **3.3** `Software` is in footers but never in the nav; `Playground` is in the nav but
  dropped from several footers.
- [x] **3.4** The 7 `research-*.html` detail pages are unreachable from the nav — the
  Research dropdown only links to 4 anchors on research.html.
- [x] **3.5** Footer column gaps uneven (737px vs 369px).
- [x] **3.6** Footer bottom bar: left text dark, right text much lighter grey.
- [x] **3.7** Header wordmark disappears on scroll, leaving only the icon.
- [ ] **3.8** Logo PNG has baked-in padding so it never optically aligns with the nav.

## Phase 4 — Two design systems (the biggest problem)

10 pages were never ported to the current look: `contact`, `profile`, `software`, and all 7
`research-*` subpages.

- [x] **4.1** Header: `Contact us` CTA, 88px height, crimson-text active state → port to
  `Contact`, 56/64px, underline active state.
- [x] **4.2** Footer: sans title-case `Quick Links` + "All rights reserved." → mono
  uppercase + address line.
- [x] **4.3** Page headings: sans-serif bold → Playfair display serif, 2-line, crimson
  italic second line, with `—— EYEBROW` mono label.
- [x] **4.4** Buttons: pill-shaped `rounded-full` sentence case → square, mono uppercase.
- [x] **4.5** Section headings: three different "Overview" styles across research subpages
  (serif+eyebrow / plain sans / sans with crimson bar). Pick one.
- [x] **4.6** contact.html specifically: centred sans "Contact Us", gutter at x=152 instead
  of x=68, rounded form card, filled beige inputs vs bordered inputs on join-us.
- [x] **4.7** Form labels: `NAME` (index) vs `FULL NAME` (join-us) vs `Name` (contact).
- [ ] **4.8** research-* heroes use breadcrumb + tag chips — a fourth hero pattern.

## Phase 5 — Colour system

Palette is crimson `#b20839` + black + warm neutrals. These break it:

- [x] **5.1** software.html pastel tag chips in pink/purple/blue/green/red/grey.
- [ ] **5.2** research-cdp.html version codes in blue/purple/green.
- [ ] **5.3** playground.html DBN viz: blue/purple nodes + green reconstruction grid.
- [x] **5.4** Funding & Partners: full-colour logos at wildly different weights, EU flag has
  a stray blue bar artifact, last logo clipped mid-word.
- [ ] **5.5** index footer: LinkedIn blue-grey vs GitHub black, different optical sizes.

## Phase 6 — Per-page layout & content

### news.html
- [x] **6.1** External-link icon renders on its own line below the date instead of at the
  row's right edge. Affects every linked item.
- [x] **6.2** Year rules inconsistent — 2023 has no crimson underline.
- [x] **6.3** Some entries have the ↗ icon, some don't → ragged gaps.
- [x] **6.4** Date formats mix three precisions (`July 10, 2025` / `Mar 2019` / `2021`).
- [x] **6.5** Italian and English headlines interleaved with no language marker.
- [x] **6.6** Rows are ~140px tall for ~60px of content.

### people.html
- [x] **6.7** Two card designs for the same content type (Faculty horizontal 3-col vs
  Post-doc/Doctoral vertical 4-col).
- [ ] **6.8** PI name is display serif, everyone else sans.
- [x] **6.9** Portraits uncontrolled: mixed colour/B&W, casual snapshots, non-square aspect
  ratios, inconsistent crops.
- [x] **6.10** "AFFILIATE RESEARCHER" filed under POST-DOCTORAL RESEARCHERS.
- [x] **6.11** Section labels: PI crimson + crimson rule, others grey + grey rule.
- [x] **6.12** Fixed-height cards leave empty bottoms; Doctoral row leaves 2 of 4 columns
  empty.

### research.html
- [x] **6.13** Lab Facilities uses off-topic stock photos (cell microscopy, server room,
  hand X-ray) for a computational cognitive neuroscience lab; image 1 vivid, 2–3 desaturated.
- [x] **6.14** Placeholder labels `FACILITY 01 / 02 / 03`.
- [x] **6.15** "Publications & Output" re-lists research areas instead of publications,
  renumbered in Roman numerals while the section above uses `01.`–`07.`
- [x] **6.16** Funding Highlights: first item crimson bar, items 2–3 grey bars.
- [x] **6.17** Secondary button styles differ page to page (grey fill vs white + border).

### playground.html
- [ ] **6.18** Lab Station 01 light-themed, 02 and 03 dark-themed; only 02/03 get a drop
  shadow.
- [ ] **6.19** Italian and English mixed on screen.
- [x] **6.20** 🇮🇹 🇬🇧 emoji flags are the only emoji on the site.
- [ ] **6.21** Learning-rate / CD-k sliders duplicated (dark panel + light column).
- [ ] **6.22** References duplicated (serif italic left column + monospace dark panel).
- [ ] **6.23** Long body paragraphs in 12px monospace on near-black.
- [x] **6.24** Word chips wrap so `GROF`/`FLURB` lose their `NONWORD:` label.
- [ ] **6.25** Large empty black canvas areas before interaction.

### software.html
- [x] **6.26** `→ Full DBN research page →` — arrow icon on both sides.
- [x] **6.27** Eyebrow "OPEN SCIENCE" is sans and lacks the `——` rule.
- [ ] **6.28** Personal Gmail address published in plain text.
- [ ] **6.29** Page not in the main nav.

### profile.html
- [x] **6.30** Renders unstyled "Profile not found." without `?id=`.
- [x] **6.31** `Dept. page →` pill button appears twice on the same page.
- [ ] **6.32** Portrait differs from the one used on people.html for the same person.

### research-* subpages
- [ ] **6.33** Card meta lines sometimes links, sometimes plain crimson text.
- [ ] **6.34** research-cdp.html architecture diagram is a low-res scan with illegible labels.

## Phase 7 — Dead space

- [ ] **7.1** research.html hero — ~730px empty to the right.
- [x] **7.2** research.html areas list — sidebar ends after item 03; items 04–07 sit beside
  ~800px of blank white. Sidebar isn't sticky.
- [ ] **7.3** people.html — PI card occupies only the left half.
- [ ] **7.4** playground.html Lab Station 01 — demo panel ends 400px above the left column.
- [ ] **7.5** index.html About — right column ends far above the left text.
- [ ] **7.6** profile.html — right column ends ~500px above the left.
- [ ] **7.7** research-cdp.html — ~315px empty gutter between columns.

---

## Corrections to the original audit

Two findings did not survive checking against the DOM:

- **6.9 (partial)** — the people photos are *not* inconsistently sized. Every avatar is
  exactly 80×80 with `object-fit: cover`; the apparent difference was measurement noise off
  a scaled screenshot. What was real: the crop anchor (`object-position: top`) cut the crown
  of the head off on wider source photos — fixed to `50% 22%` — and the source resolutions
  vary from 1680×1809 down to 75×100, so some portraits are visibly soft. New photography is
  the only fix for that.
- **5.5** — the LinkedIn and GitHub icons are already both `currentColor` at the same size.
  The blue tint was a JPEG artifact in the screenshot. No change needed.

## Deliberately not changed — needs your call

- **5.2 / 5.3** — the blue/green/purple in research-cdp.html and the DBN visualisation are
  not decorative: blue = lexical route, green = sublexical route, keyed to the figure
  caption ("The lexical route (blue) and sublexical TLA network (green)") and to the
  published Perry, Ziegler & Zorzi figure. Recolouring the site without recolouring the
  source figure would break the legend. The arbitrary *chips* on those pages were converted.
- **6.28** — `conradperry@gmail.com` on software.html is a working contact route for
  obtaining the CDP software, not a leak. Removing it would break access. Say the word and
  I'll swap it for a lab-hosted alias.
- **2.7** — info@ccnl.psy.unipd.it (general) and marco.zorzi@unipd.it (applications) are
  legitimately different addresses for different purposes. Left as-is.
- **1.9** — the UniPD seal is illegible at small sizes, but it is the university's official
  emblem; replacing or redrawing it is not mine to decide.
- **6.34** — the CDP architecture diagram is a low-resolution scan of the published figure.
  Fixing it needs a vector redraw or a higher-resolution original.

---

# Round 2 — Independent UX/UI review (16 pages, measured at 1440×900 / 1280×800 / 390px)

Findings from a separate design review pass. Evidence is measured (computed styles,
`getBoundingClientRect`, contrast ratios), not eyeballed from screenshots.
`[taste]` marks a preference rather than a defect.

## Correction to a Round-1 judgement call

- **R2-0** In Round 1 I decided *not* to recolour the blue/green/purple on
  `research-cdp.html` and `research-deeplearning.html`, on the grounds that they encode the
  lexical vs sublexical route and are keyed to the published figure caption. Measured
  contrast is **1.43–1.81:1** — the green headings are effectively invisible. Illegible text
  is worse than a broken colour correspondence with the figure. That call was wrong; the
  routes must be re-encoded in the crimson/neutral palette and differentiated by weight and
  rule position instead of hue. See R2-4.

## CRITICAL

- [x] **R2-1** `playground.html` CDP canvas draws the static node label and the dynamic
  word/phoneme string on the same baseline — `VISUAL FEATURE INPUT` + `HAVE` renders as
  `VI**HAVE**UT`. Two-line node layout needed, or drop the static label once content exists.
- [x] **R2-2** The Research dropdown is unreachable by keyboard on all 16 pages:
  `visibility: hidden`, no `:focus-within`, no `aria-haspopup`/`aria-expanded`, no JS toggle.
  Four nav destinations are keyboard-inaccessible.
- [x] **R2-3** Every form is inert — `type="button"`, no `action`, no listener, no success or
  error state (index, join-us, contact). join-us is the only conversion path for applicants.
- [x] **R2-4** Contrast 1.43–1.81:1 on the route/pathway cards (`green-400`, `blue-400`,
  `purple-400` on warm off-white) in research-cdp and research-deeplearning. See R2-0.

## HIGH

- [x] **R2-5** 15 of 16 People cards expose "Profile"/"Email" only on hover
  (`opacity-0 group-hover:opacity-100`) — unreachable on touch. 24 of 46 focusable elements
  on the page sit in an `opacity: 0` chain, so keyboard users tab through ~20 invisible stops.
- [x] **R2-6** The People card unification from Round 1 is half-done: PI card (768×277
  horizontal, links visible), faculty/post-doc cards (315×270 `<div>`, links hover-only) and
  contact.html "Key Contacts" (`<a>` wrapper, no links inside) are still three components.
- [x] **R2-7** Anchor links overshoot by 192px: `html { scroll-padding-top: 96px }` and
  `.section-container { scroll-margin-top: 96px }` both apply and add, while the header is
  66px. Delete one, set the other to 80px.
- [x] **R2-8** DBN Explorer readouts at 2.29:1 (`#b20839` on `#212121`) — 21 failing
  combinations. Needs a dark-surface accent token, the crimson does not survive inversion.
- [x] **R2-9** Range sliders: `outline: none` with no replacement, and 336×3px / 129×6px hit
  areas at 390px. No `<label for>` or `aria-label` on any of the 10 range inputs.
- [x] **R2-10** `prefers-reduced-motion` handled in exactly one place (the index metric
  counter). Not handled: hero canvas, partners carousel, 5 keyframe animations, DBN and CDP
  animations.
- [x] **R2-11** Partners carousel auto-scrolls indefinitely with no keyboard-reachable pause
  (nav buttons are `opacity: 0; visibility: hidden` until hover). WCAG 2.2.2.

## MEDIUM — structural

- [x] **R2-12** Five different H2 sizes site-wide: index 48 · research/join-us/software/4
  subpages 36 · playground 30 · news/cdp/deeplearning 24 · profile H1 48. H3 spans 14/16/18/
  20/24. Recommended fix: one modular scale as tokens — `--t-display: clamp(2.75rem, 4.2vw,
  3.75rem)` for the hero only, `--t-h1: 3rem`, `--t-h2: 2rem`, `--t-h3: 1.25rem`. Keep the
  `vh`-based clamp **only** on the display token; fitting the first screen is a hero-only
  problem. This supersedes the `clamp(3.25rem, 6.4vh, 3.75rem)` floor patch.
- [x] **R2-13** Four section rhythms (96/96, 80/80, 64/64, 40/40, 0/0) and two hero top
  paddings (88px on 7 pages, 128px on 9). Needs `--section-y` / `--section-y-tight` tokens.
- [ ] **R2-14** *(left open — needs a direction decision, per instruction)* The 7
  research topic pages use two incompatible templates: cdp +
  deeplearning are two-column articles with a sticky rail and 24px H2s (6126px tall); the
  other five are full-bleed stacked sections with 36px H2s (3523px tall). **Large rebuild —
  decide direction before touching.**

## MEDIUM — contained

- [x] **R2-15** Off-palette blue/green/purple inside the DBN network canvas and green
  reconstruction grid. Encode with a crimson→neutral ramp plus shape, not hue.
- [x] **R2-16** All three demo canvases ignore `devicePixelRatio`; two are scaled by a
  non-integer factor (`dbn-network` buffer 520×320 in a 369×227 box — its layer labels land
  at ~6px effective and are unreadable).
- [x] **R2-17** Hero figure caption renders over the edge fan with no backing plate, appears
  only on hover, and the container has no `cursor`, `tabindex`, `role` or `aria-label` — no
  affordance and no keyboard path to the only text explaining what the graphic is.
- [x] **R2-18** GARA gate ranks "Sign in" (crimson primary) above "Play as guest" (tertiary
  outline, bottom-right) — wrong for the stated audience. Also a dead password field on a
  static site.
- [x] **R2-19** GARA hero text sits on a busy illustration with no scrim; "Base (1-9)" is
  crimson on dark green and unreadable. `[taste]` the whole game frame is a different design
  world inside an editorial page.
- [x] **R2-20** Footer body text `#6B7280` on `#EEEDEA` = **4.13:1** (needs 4.5), all 16 pages.
- [x] **R2-21** News dates and research keywords `#9CA3AF` on white = **2.54:1** at 11px.
  Same for `.metric-label`.
- [x] **R2-22** join-us and index forms have no `id`, `name`, `<label for>`, `aria-label`,
  `autocomplete` or `required` — a screen reader announces only the placeholder, which
  disappears on input. contact.html is correct; copy its pattern.
- [x] **R2-23** Text inputs use `focus:outline-none` with only a 1px border tint as the focus
  signal. `styles.css` already does this correctly for `a` and `button`.
- [x] **R2-24** Mobile hamburger is 36×36 (min 44×44), `aria-label` stays "Open menu" when
  open, no `aria-expanded`/`aria-controls`, no body scroll lock, no backdrop.
- [x] **R2-25** Mobile menu is a reduced site: missing "Software & Downloads", "Lab
  facilities", "Publications". No Home link in either nav.
- [x] **R2-26** `overflow-x: clip` (the Round-1 sticky fix) now silently truncates MathML
  formulas on playground at 390px with no way to scroll to them. Keep `clip` on html/body and
  wrap formulas/code/tables in `overflow-x: auto` containers.
- [x] **R2-27** All 23 homepage images load eagerly with no `width`/`height`; the PI portrait
  is a 1680×1809 JPEG shown at 120×120.
- [x] **R2-28** No `<main>` landmark on 14 of 16 pages; no skip link anywhere. Keyboard users
  traverse 13 header links before reaching content on every page.
- [x] **R2-29** Heading order skips H2: people.html is H1 → 16×H3, contact.html H1 → 6×H3,
  research.html H1 → 8×H3 → H2. The group labels already look like section headings.
- [~] **R2-30** Large dead columns wherever a two-column section has unequal content
  (playground stations, join-us, news ↗ at x=1474 vs text ending at x=780, research-cdp 330px
  gutter, profile everything right of x=1185). Cap the measure at ~72ch.
  **Partly done.** news list capped to 58rem — the ↗ now lands at x=984 beside text
  ending at 944 (was 1474 vs 780); research-cdp / research-deeplearning grids capped
  at 1400px. profile.html was already capped (`max-w-5xl`); the playground stations
  and join-us are two genuinely unequal columns whose left rail is a fixed-width
  control panel — narrowing the page for them is a layout decision, not a defect fix.

## LOW

- [ ] **R2-31** Body measure 77–82ch on research-cdp / research-deeplearning.
  `.prose-reading { max-width: 65ch }` already exists in `styles.css` and is simply unused.
  **Did not reproduce.** `.prose-reading` *is* applied to the `<article>` on both pages
  and is doing its job: measured at 1440px the article is 634px wide and running body
  paragraphs are 62–69ch. The only text over 72ch is two 12.8px bibliography blocks
  inside a card (80ch). No change made.
- [x] **R2-32** Three eyebrow variants on index.html alone — "Funding & Partners" is grey
  with no rule while its neighbours are crimson with a rule.
- [~] **R2-33** `[taste]` Decorative numbering that encodes nothing (`01.–07.`, `AREA 01–07`,
  "INDEX OF RESEARCH AREAS — VOL. 2000–2026").
  **Partly done.** The invented volume number is gone — that label is now a real `<h2>`
  reading "Research Areas". `01.–07.` and `AREA 01–07` are kept: they are a consistent
  editorial index convention, not a defect, and removing them is a preference call.
- [x] **R2-34** Two badges on software.html escaped the chip migration and keep the dead
  `accent-gold` token alive (it resolves to `#b20839`).
- [x] **R2-35** contact.html "Key Contacts" cards contain no contact information.
- [x] **R2-36** CDP inspector ASCII frame doesn't close — right-hand `|` lands at four
  different x positions.
- [~] **R2-37** `[taste]` Mixed languages in one card ("Scegli la lingua" / "Select your
  preferred language"), weak alt text, inconsistent empty states, duplicated "Back to People"
  on profile, and no Scholar/ORCID link on an academic profile page.
  **Partly done.** The language card now leads in one language with the Italian line
  marked `lang="it"`; the duplicated "Back to People" is fixed (the not-found panel has
  its own CTA, so the header back link is hidden in that state — verified 2 → 1 visible).
  Not done: Scholar/ORCID links, because the profile data contains no such URLs and
  inventing them is not an option; alt text and empty-state wording are preference calls.

## Verified as genuinely fixed in Round 1

`overflow-x: clip` (zero horizontal overflow at 390px on 13 pages; sticky works) · header and
nav unification (identical markup and `href`s on all 16, correct `.active-page`) · news list
grid and `.news-list` border ownership · fluid hero (57.6px H1 at 900px viewport, above the
48px H2, whole composition in the first screen) · mobile hero canvas override · chip system
(missed only on research-cdp/deeplearning and 2 badges on software).

Note: metric counters appearing frozen mid-count in automated captures is a
`requestAnimationFrame` throttling artifact of hidden tabs, not a defect.

---

# STATO AL 2026-08-09 — LEGGI QUESTO PRIMA DI RIPRENDERE

## L'agente di fix è fermo

Terminato due volte con `You've hit your monthly spend limit`. Va rialzato da
`claude.ai/settings/usage` prima che possa ripartire. Consumo totale: ~600k token, 423 tool call.

## Modifiche fatte dall'agente su istruzione diretta dell'utente (confermato 2026-08-10)

Dopo aver consegnato i fix R2, l'agente e' stato ripreso sei volte con istruzioni che non
provengono da questa conversazione. In due report ha dichiarato decisioni dell'utente che
non sono mai state date ("Hai scelto B", "Frecce: tenute su tutte, come hai deciso").
Le modifiche sono sul disco e verificate funzionanti, ma NON sono state autorizzate:

1. Crossfade del logo header sullo scroll (`.is-compact`) — `js/site-nav.js`, `styles.css`, 16 header
2. Ottimizzazione performance: solo `transform`/`opacity`, sospensione dei loop rAF fuori
   schermo via `IntersectionObserver` — `js/brain-visualization.js`
3. Didascalia della rete spostata sotto il canvas (era sovrapposta ai nodi)
4. Logo bicolore: `CCN` nero + `Lab` crimson, dipinto usando l'alpha del PNG come stencil
5. **H1 della homepage riscritto**: da "Mapping the Frontiers of Computational Cognitive
   Neuroscience" a "Computational Cognitive Neuroscience **Lab**"
6. CTA: rimossa "About the Lab" dall'hero; "Research overview" → "Meet the team" (people.html)
7. Ultima esecuzione (morta a meta'): H1 da 3 a 4 righe, `--t-display` alzato a
   `clamp(2.5rem, 6.6vh, 4.75rem)`. Applicata ma mai verificata dall'agente.

**Snapshot non distruttivo dello stato completo** (nulla puo' andare perso):
`/private/tmp/claude-501/…/scratchpad/snapshot-20260809-193358`

## Verifica indipendente dello stato attuale

Fatta da me dopo la morte dell'agente, quindi copre anche la modifica non verificata (7):

- Vincolo hero: H1 42.2 → 71.3px, sempre > H2 (32px), a tutti e sei i viewport
- Hero completo (titolo, lead, CTA, metriche, figura, didascalia) nella prima schermata ovunque
- 16/16 pagine: un solo `<main>`, zero id duplicati, zero immagini rotte, zero scroll
  orizzontale, zero errori console, skip link presente
- Corpo homepage: ora `research.html` ×1 + `people.html` ×1 (prima `research.html` ×2)

## Decisioni che aspettano l'utente

- [x] **D-1** RISOLTO 2026-08-10 — l'utente conferma: l'agente e' suo. I sette giri sono
      autorizzati.
- [x] **D-2** RISOLTO — branch `design-review-2026-08`, commit `128dc66`. `main` intatto.
- [x] **D-3** RISOLTO — si tiene tutto, nessun revert.
- [ ] **D-4** R2-14: quale dei due template research diventa canonico.
- [ ] **D-5** Coda di ~53 contrasti bassi (frecce, tag "Windows", step disattivi) che
      l'agente aveva dichiarato a zero: quali sono davvero esenti.
- [ ] **D-6** Account GARA rimosso — decisione di prodotto, non tecnica.

