# Actus Design System · v1.0

> **The System behind the movement.**
> A complete design language built around **premium athleisure, quiet luxury, and high-performance tech.** Inspired by the fluid, modern architectural curves of Oscar Niemeyer, every token, component, and rule is documented so the product scales with elegance and AI-driven precision.
> *Version 1.0 · Released 2026*

**System Meta:**

* **Colors:** 30+ Core & Semantic Tokens
* **Typography:** Barlow Condensed, Share Tech Mono & Barlow
* **Components:** 20+ Building Blocks (React/Vite ready)
* **Grid:** 4pt Base

---

## 01 · Foundations

Every interface decision traces back to a token. Color, type, spacing, fluid radius — defined once, used everywhere. The constraint is the product.

### 1.1 Color Palette

#### Brand & Accent

| Role               | Name         | Value     | Notes                                       |
|:------------------ |:------------ |:--------- |:------------------------------------------- |
| **Brand Accent**   | Brand Neon   | `#CBFE00` | Primary action points, energetic highlights |
| **Primary Base**   | Primary      | `#FFFFFF` | Core structural highlights                  |
| **Secondary Base** | Secondary    | `#4DE082` | Progress and secondary actions              |
| **Tertiary Base**  | Tertiary     | `#FFFFFF` | Soft structural elements                    |
| **Surface Tint**   | Surface Tint | `#ABD600` | Subtle brand glows                          |

#### Background & Surfaces (Quiet Luxury Dark Mode)

The dark mode background moves from pure charcoal to a deep blue-green base, using `#1A343F` as the primary canvas while preserving the Actus brand/accent colors. Surfaces step gradually lighter to create depth without breaking the quiet luxury direction.

| Role              | Name                   | Value     | Notes                                      |
|:----------------- |:---------------------- |:--------- |:------------------------------------------ |
| **Base / Lowest** | Background / Lowest    | `#10252D` | Deepest app layer, behind the main canvas  |
| **Base Canvas**   | BG Base                | `#1A343F` | Primary dark mode background               |
| **Surface 1**     | BG Surface 1 / Low     | `#203F4B` | Standard cards and containers              |
| **Surface 2**     | BG Surface 2 / Mid     | `#294B58` | Hover states and elevated cards            |
| **Surface 3**     | BG Surface 3 / High    | `#345867` | Modals, sheets, floating elements          |
| **Surface 4**     | BG Surface 4 / Highest | `#406575` | Maximum elevation and active containers    |

#### Text & Outlines

| Role               | Name              | Value                       | Notes                                    |
|:------------------ |:----------------- |:--------------------------- |:---------------------------------------- |
| **Text Primary**   | Text Primary      | `#FFFFFF`                   | Main typography, headings                |
| **Text Secondary** | Text Secondary    | `rgba(255, 255, 255, 0.70)` | Body copy, supporting text               |
| **Text Tertiary**  | Text Tertiary     | `rgba(255, 255, 255, 0.50)` | Meta, timestamps, disabled               |
| **Text Inverse**   | Text Inverse      | `#141414`                   | Text on neon/light backgrounds           |
| **On-Surface**     | On-Surface        | `#E2E4CF`                   | Variant for subtle text on dark surfaces |
| **Outlines**       | Outline / Variant | `#8E9379` / `#444933`       | Borders and dividers                     |

#### Semantic & Feedback

| Role        | Name    | Value     | Notes                                 |
|:----------- |:------- |:--------- |:------------------------------------- |
| **Success** | Success | `#4ADE80` | Completed goals, positive AI feedback |
| **Warning** | Warning | `#FBBF24` | Alerts, caution states                |
| **Error**   | Error   | `#F87171` | Destructive actions, form errors      |
| **Info**    | Info    | `#60A5FA` | System messages, tooltips             |

#### Gradients

* **Gradient Brand:** `linear-gradient(135deg, #CBFE00 0%, #A2CB00 100%)` — Used for premium callouts and AI-generated insight cards.
* **Gradient Streak:** `linear-gradient(135deg, #F97316 0%, #EF4444 100%)` — Used for high-intensity achievements and continuous activity tracking.

#### CSS Color Tokens Recommendation

```css
:root {
  --bg-lowest: #10252D;
  --bg-base: #1A343F;
  --bg-surface-1: #203F4B;
  --bg-surface-2: #294B58;
  --bg-surface-3: #345867;
  --bg-surface-4: #406575;

  --brand-neon: #CBFE00;
  --secondary: #4DE082;
  --surface-tint: #ABD600;

  --text-primary: #FFFFFF;
  --text-secondary: rgba(255, 255, 255, 0.70);
  --text-tertiary: rgba(255, 255, 255, 0.50);
  --text-inverse: #141414;
}
```


### 1.2 Typography System

The typography follows the **PulseX rule** while preserving the Actus color palette. The system is built around three distinct typographic jobs: **condensed impact**, **technical precision**, and **clear narrative reading**.

#### Font Import

```html
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700;800;900&family=Barlow:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap" rel="stylesheet">
```

#### Family 01: Barlow Condensed

* **Usage:** Display, Brand Headings, Hero Numbers, Primary Buttons, Screen Titles, KPI Highlights.
* **Role:** Creates a strong, athletic, high-performance feeling. Use it when the information needs visual impact before detailed reading.
* **Rules:**
  * Use uppercase for major headings, CTAs, section labels, and hero metrics.
  * Prefer heavier weights: **800–900** for display and key actions.
  * Keep tracking tight in large sizes and wider in small labels.
* **Scale:**
  * **D1 (Display):** 72px / 0.9 line-height / -1% letter-spacing / 900 weight / uppercase
  * **H1 (Heading):** 48px / 0.95 line-height / -0.5% letter-spacing / 900 weight / uppercase
  * **H2 (Heading):** 32px / 1 line-height / -0.2% letter-spacing / 900 weight / uppercase
  * **H3 (Heading):** 22px / 1.1 line-height / 0% letter-spacing / 800–900 weight / uppercase
  * **L1 (Label / CTA):** 14px / 1 line-height / 18% letter-spacing / 800 weight / uppercase

#### Family 02: Share Tech Mono

* **Usage:** Data, Metrics, Counters, Timestamps, Technical Labels, Eyebrows, Build/Version Information.
* **Role:** Communicates precision. Use it when the information should feel exact, trackable, or system-generated.
* **Rules:**
  * Use for short, structured information — not long paragraphs.
  * Use Actus accent colors for emphasis, especially `Brand Neon (#CBFE00)` for active or positive technical states.
  * Avoid using mono for emotional, instructional, or brand-led copy.
* **Scale:**
  * **Data Big:** 36px / 1 line-height / 8% letter-spacing / 400 weight
  * **Data Medium:** 18px / 1.2 line-height / 12% letter-spacing / 400 weight
  * **Meta Small:** 11px / 1.4 line-height / 15% letter-spacing / 400 weight
  * **Eyebrow XS:** 10px / 1.5 line-height / 30% letter-spacing / 400 weight / uppercase

#### Family 03: Barlow

* **Usage:** Body Copy, Product Descriptions, AI Assistant Responses, Form Values, Helper Text, Empty States.
* **Role:** Handles narrative, instruction, and readability. This is the default font for anything the user needs to read calmly.
* **Rules:**
  * Use for any text longer than 8 words.
  * Use **400–500** for standard body and **600–700** for emphasis.
  * Keep long-form reading in `Text Secondary` or `On-Surface` depending on surface contrast.
* **Scale:**
  * **LG (Body):** 18px / 1.55 line-height / 0% letter-spacing
  * **MD (Body):** 15px / 1.6 line-height / 0% letter-spacing
  * **SM (Body / Meta):** 13px / 1.65 line-height / 0% letter-spacing

#### Typography Usage Map

| Typeface             | Use When                     | Examples                                      | Avoid For                            |
|:-------------------- |:---------------------------- |:--------------------------------------------- |:------------------------------------ |
| **Barlow Condensed** | The content needs impact     | Hero titles, main KPIs, CTAs, section titles  | Long paragraphs, helper text         |
| **Share Tech Mono**  | The content needs precision  | Data points, timestamps, counters, meta tags  | Emotional copy, instructions         |
| **Barlow**           | The content needs reading    | Body copy, descriptions, forms, AI responses  | Hero metrics, expressive headlines   |

#### CSS Token Recommendation

```css
:root {
  --font-display: 'Barlow Condensed', sans-serif;
  --font-body: 'Barlow', sans-serif;
  --font-mono: 'Share Tech Mono', monospace;
}

.heading-display {
  font-family: var(--font-display);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -0.01em;
}

.data-label {
  font-family: var(--font-mono);
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.body-copy {
  font-family: var(--font-body);
  line-height: 1.6;
}
```

#### Color Rule for Typography

The typography must inherit the **Actus color system**, not the PulseX palette.

* **Headings:** `Text Primary (#FFFFFF)`
* **Body Copy:** `Text Secondary (rgba(255, 255, 255, 0.70))`
* **Meta / Technical Labels:** `Text Tertiary (rgba(255, 255, 255, 0.50))`
* **Active Data / Accent Labels:** `Brand Neon (#CBFE00)`
* **Text on Neon CTAs:** `Text Inverse (#141414)`

### 1.3 Spacing, Grid & Architectural Radius

#### Spacing Scale (4pt Base)

* **XS (4px) - SM (8px):** Tight groups, inline chip padding.
* **MD (12px) - LG (16px):** Form field padding, standard card padding.
* **XL (24px) - 2XL (32px):** Section spacing, major block separation.

#### Border Radius (Fluid Geometry)

Embracing Niemeyer's philosophy, corners are rarely sharp, favoring organic curves.

* **4px (XS):** Data tags, micro-components.
* **12px (MD):** Standard cards, form inputs.
* **24px (LG):** Modals, featured AI insight containers.
* **100px (Full):** Primary action buttons, chips, avatars.

---

## 02 · Components

### 2.1 Buttons

* **Primary (Go Action):** BG `Brand Neon (#CBFE00)`, Text `Text Inverse (#141414)`, Padding 16px, Radius 100px. Barlow Condensed 800–900, uppercase.
* **Secondary (Soft Action):** Transparent BG, 1px solid `Outline (#8E9379)`, Text `Text Primary`.
* **Ghost:** No border, Text `Text Secondary`, subtle hover state using `Surface 2`.

### 2.2 Form Fields & Inputs

* **Default:** BG `BG Surface 1 (#203F4B)`, 1px solid `Outline Variant (#444933)`, Radius 12px.
* **Focused:** BG `BG Surface 1 (#203F4B)`, 1px solid `Brand Neon (#CBFE00)`, soft outer glow using `Surface Tint`.
* **AI Assist Input:** Features an integrated spark icon in `Brand Neon` to indicate generative capabilities or smart completions.

### 2.3 Cards

* **Neutral Card:** BG `BG Surface 1 (#203F4B)`, Border none or 1px `Outline Variant`.
* **Elevated Card:** BG `BG Surface 2 (#294B58)`, subtle drop shadow.
* **Highlight/Streak Card:** Uses `Gradient Streak` as a top border or subtle background tint.

### 2.4 Tags & Chips

* **Neutral:** BG `BG Surface 2 (#294B58)`, Text `Text Secondary`.
* **Active:** BG `Primary Container (#C3F400)`, Text `On-Primary Container (#556D00)`.
* **Success:** BG `Success (#4ADE80)`, Text `#000000`.

---

## 03 · Patterns

### 3.1 Screen Layout (Minimalist Focus)

**Rule: One primary intention per screen.**

1. **Header:** Clean, distraction-free. Brand + nav.
2. **Primary Zone:** Hero card answering the main user objective (e.g., today's wellness target).
3. **Primary CTA:** High contrast `Brand Neon`, drawing the eye immediately.
4. **Secondary Data:** Supporting metrics in `Text Secondary` on `BG Surface 1`.

### 3.2 State & Feedback

* **Data Zones:** Raw data is presented in monospaced or structured tables; "Trusted" or AI-processed insights are presented in elevated `Surface 2` cards with natural language text.
* **Loading/Processing:** Instead of standard spinners, use a subtle, sweeping opacity animation over the `Gradient Brand`.

---

## 04 · Voice & Motion

### 4.1 Voice & Tone

1. **Quiet Luxury:** Communication is composed, premium, and unobtrusive. We guide, we don't shout.
2. **Intelligent & Adaptive:** Feedback feels personalized and data-driven.
3. **Refined Motivation:** Celebrate milestones elegantly. (e.g., *"Target achieved. Form maintained."* instead of *"🎉 AWESOME JOB! 💪"*)

### 4.2 Motion Principles

* **Fluid Transitions (300ms):** Page and screen transitions use smooth easing `cubic-bezier(0.4, 0.0, 0.2, 1)`, mimicking natural physical momentum.
* **Micro-interactions (150ms):** Buttons and toggles respond instantly but smoothly, never abruptly.
* **Generative Reveals:** When AI assists or generates content (like workout adjustments or styling suggestions), elements fade in softly from the bottom up, indicating creation.

---

### ◆ THE GOLDEN RULE

**Elegance through performance.**
Every component in the Actus Design System must not only look premium but render with absolute efficiency. The aesthetic is calm, but the underlying architecture is relentlessly fast.
