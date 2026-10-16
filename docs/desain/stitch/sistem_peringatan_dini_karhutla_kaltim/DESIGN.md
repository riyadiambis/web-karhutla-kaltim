---
name: Sistem Peringatan Dini Karhutla Kaltim
colors:
  surface: '#f8f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f8f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#43474d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#73777e'
  outline-variant: '#c3c7cd'
  surface-tint: '#46617b'
  primary: '#001527'
  on-primary: '#ffffff'
  primary-container: '#0b2a42'
  on-primary-container: '#7792ae'
  inverse-primary: '#aec9e8'
  secondary: '#2e6192'
  on-secondary: '#ffffff'
  secondary-container: '#98c7ff'
  on-secondary-container: '#1d5384'
  tertiary: '#0d1519'
  on-tertiary: '#ffffff'
  tertiary-container: '#22292e'
  on-tertiary-container: '#899097'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cee5ff'
  primary-fixed-dim: '#aec9e8'
  on-primary-fixed: '#001d33'
  on-primary-fixed-variant: '#2e4962'
  secondary-fixed: '#d1e4ff'
  secondary-fixed-dim: '#9ecaff'
  on-secondary-fixed: '#001d36'
  on-secondary-fixed-variant: '#0c4979'
  tertiary-fixed: '#dce3ea'
  tertiary-fixed-dim: '#c0c7ce'
  on-tertiary-fixed: '#151c21'
  on-tertiary-fixed-variant: '#40484d'
  background: '#f8f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-lg:
    fontFamily: Public Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Public Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Public Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Public Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Public Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Public Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-sm:
    fontFamily: Public Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-mono-lg:
    fontFamily: IBM Plex Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 24px
  data-mono-md:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  data-mono-sm:
    fontFamily: IBM Plex Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style
The design system embodies a modern, institutional, and dependable public-service aesthetic tailored for the provincial context of East Kalimantan (Kalimantan Timur). It serves rural communities, plantation managers, farmers, village chiefs (*kepala desa*), and field volunteers with varying technical literacy and outdoor display constraints.

The visual style is **Modern Civic Utility**:
- **Demeanor:** Calm, authoritative, and civic-minded. It intentionally avoids sensationalist red-dominated disaster themes, opting instead for a stable deep navy core paired with objective, clear color-coded statuses.
- **Principles:** High contrast, legible outdoors under direct equatorial sunlight, low latency, and zero unnecessary visual noise. Avoid decorative gradients, micro-skeuomorphism, or decorative glassmorphism.
- **Progressive Disclosure:** Complex meteorological, hotspot (FDRS), and geospatial data are summarized through plain-language risk tiers first, allowing deep dives into coordinates, weather metrics, and moisture indices only when demanded by the user.

## Colors
The palette balances institutional trust with unequivocal hazard identification. All text meets or exceeds WCAG 2.1 AA (4.5:1) legibility standards against `#FFFFFF` or `#F3F5F7`.

### Core Palette
- **Canvas / Background:** `#F3F5F7` — Cool off-white minimizing glare on outdoor mobile screens.
- **Surface:** `#FFFFFF` — Solid card panels paired with a 1px border (`#D5DCE3`).
- **Primary Navy:** `#0B2A42` — Main banners, top bars, primary buttons, and key headings.
- **Link / Interactive Accent:** `#0E4A7A` — Focused action triggers, interactive text links, active tab lines.
- **Border / Divider:** `#D5DCE3` — Crisp separation for cards, tables, and map framing.

### Alert & Risk Matrix (Mandatory Dual-Encoding)
Color must never be the only indicator of severity; every risk metric must pair its hue with unambiguous typography (Indonesian labels) and icon/bar cues:
- **Rendah (Low):** `#3A9D5D` — Safe baseline moisture, minimal active hotspot indicators.
- **Sedang (Moderate):** `#F2C94C` — Requires text pairing with dark `#0B2A42` or a dark outline to preserve contrast.
- **Tinggi (High):** `#E46A2E` — Dry conditions, heightened watch for clearing activities.
- **Sangat Tinggi (Extreme):** `#9B1C1C` — Critical drought, high fire spread velocity, total burning ban.

## Typography
Typography is tuned for fast scannability and structural clarity.

- **Primary Typeface (Public Sans):** A robust, government-grade geometric grotesque optimized for high clarity on both low-dpi Android handsets and high-resolution terminals.
- **Data & Metric Display (IBM Plex Sans / Tabular Numbers):** Used for coordinates (GPS / UTM), FDRS (Fire Danger Rating System) numerical indexes, confidence percentages, wind velocity, and timestamp logs to avoid layout jitter during live telemetry refreshes.
- **Case Conventions:** Risk badges utilize uppercase with loose tracking (`label-sm`, 0.05em) for immediate recognition. Section headings follow standard sentence capitalization to preserve an approachable tone.

## Layout & Spacing
The layout relies on a modular, fluid-responsive 12-column grid system (4 columns on mobile, 8 on tablet, 12 on desktop) centered within a maximum width of 1280px.

- **Touch Targets:** Any interactive button, switch, filter pill, or tab retains a minimum touch bounding box of 44×44px, accommodating single-handed usage on uneven ground or with field gloves.
- **Rhythm:** Spacing sticks strictly to an 8px base rhythm (`0.25rem` = 4px half-step for micro paddings, `0.5rem` = 8px, `1rem` = 16px, `1.5rem` = 24px, and `2.5rem` = 40px).
- **Responsive Stacking:**
  - **Mobile (< 768px):** Critical risk ribbons and location dropdowns lock to the top. Horizontal filter strips scroll smoothly along the x-axis with edge fading.
  - **Desktop (≥ 1024px):** Split-view operational pattern. Left-hand panels (4 cols) host filters, regional summaries, and alerts; right-hand panels (8 cols) host interactive hotspot map viewers and live tabular feeds.

## Elevation & Depth
This design system rejects heavy drop shadows, dynamic 3D elevations, and layered glass effects to maintain battery efficiency and high visual contrast under harsh sun.

- **Flat Layering & Borders:** Surfaces achieve definition strictly via `#FFFFFF` fills bounded by solid 1px `#D5DCE3` outlines.
- **Functional Hover/Active Elevation:** For interactive cards and buttons, elevation does not use high-blur drop shadows. It relies instead on a crisp 1px tone shift (border becomes `#0E4A7A`) or an instant 1px offset line (`0px 2px 0px rgba(11, 42, 66, 0.08)`).
- **Modal Overlays & Drawers:** High-priority warnings and notification sheets use a neutral dark scrim (`rgba(11, 42, 66, 0.5)`) paired with a sharp 1px `#D5DCE3` bottom-sheet edge.

## Shapes
A disciplined 8px (`0.5rem`) corner radius governs all content cards, input boxes, status chips, and modular panels.

- **Standard Containers:** Cards, modals, alerts, and map overlays use `0.5rem` (8px). This creates a structured yet non-punitive feel that avoids brutalist harshness while remaining clean and institutional.
- **Tags, Badges & Pills:** Filter buttons and risk status indicators may use `rounded-full` (9999px) or `rounded` (4px), maintaining consistent inner radius proportions relative to parent cards.
- **Strict Prohibition:** Asymmetrical corner radiuses and morphic or organic blob shapes are prohibited.

## Components

### 1. Status & Risk Cards
- **Structure:** Solid `#FFFFFF` surface, 8px border-radius, bounded by a 1px `#D5DCE3` outline.
- **Risk Ribbon:** A 6px thick solid color bar pinned flush to the left vertical edge (`#3A9D5D`, `#F2C94C`, `#E46A2E`, or `#9B1C1C`).
- **Content:** Kabupaten/Kecamatan name in `headline-sm`, status badge using `label-sm` with solid background + text, followed by tabular confidence levels (e.g., "Confidence: 87%").

### 2. Buttons
- **Primary:** Background `#0B2A42`, text `#FFFFFF`, 8px radius, height 44px. Hover state deepens to `#081E30`.
- **Secondary / Ghost:** Background transparent, 1px solid `#0E4A7A`, text `#0E4A7A`.
- **Emergency Call / Report Action:** Background `#9B1C1C`, text `#FFFFFF`, bold icon leading.

### 3. Date & Timeline Chips
- Horizontal scrolling track with snapping enabled.
- **Resting:** Background `#FFFFFF`, border 1px solid `#D5DCE3`, label in `body-sm`.
- **Selected:** Background `#0B2A42`, text `#FFFFFF`, border 1px solid `#0B2A42`. Displays formatted day of week and date (e.g., "Sen, 12 Agu").

### 4. Form Inputs, Checkboxes & Radios
- **Inputs:** 44px height, background `#FFFFFF`, border 1px solid `#D5DCE3`, focus ring 2px `#0E4A7A` with no offset blur.
- **Checkboxes & Radios:** 20×20px minimum size within a 44×44px padded clickable container. Selected states fill with `#0B2A42` containing a white checkmark.

### 5. Map Cards & Data Tables
- **Map Framing:** Framed in standard card syntax with an integrated top control bar for toggling overlay layers (Satelit NOAA20, Terra/Aqua, Sentinel). A 1px grid lines overlay aesthetic provides precise visual calibration.
- **Data Tables:** Alternating rows using `#FFFFFF` and `#F3F5F7`. Header row styled in `#0B2A42` text with bottom border 2px `#D5DCE3`. Numerical coordinates and timestamps aligned right using `data-mono-md`.

### 6. Linear Progress Bars (Risk Scale)
- Height 8px, track `#D5DCE3`, 4px radius. 
- Multi-segment color indicator demonstrating current hazard location along the continuous spectrum from green to dark red.