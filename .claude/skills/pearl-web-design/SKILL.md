---
name: pearl-web-design
description: >
  Design, implement, and refine modern web interfaces using the Pearl
  Design System. Use this skill when creating web pages, dashboards,
  components, forms, layouts, or modifying existing frontend UI.
  Apply the Pearl color palette, typography, spacing, accessibility,
  and component styling consistently across the application.
---

## 1. Purpose

Create modern, elegant, minimalist web interfaces using the **Pearl Design System**.

The visual identity should be:

- Warm, calm, and professional.
- Minimalist but not sterile.
- Elegant and contemporary.
- Focused on readability and usability.
- Consistent across pages and components.

Favor generous whitespace, soft pastel accents, rounded cards, subtle shadows, and carefully balanced typography.

Avoid excessive decoration, strong gradients, harsh borders, unnecessary animations, and overly saturated colors.

## 2. Color System

### 2.1 Core Colors

| Token | Hex | Usage |
|---|---|---|
| Primary | `#3A2044` | Headings, primary branding |
| Primary Hover | `#643B73` | Primary interactive states |
| Sidebar | `#665166` | Navigation sidebar |
| Secondary | `#AF9AC9` | Secondary accents |
| Secondary Hover | `#8D55A3` | Secondary interactive states |
| Accent | `#EB8F48` | Primary CTA buttons |
| Accent Hover | `#BD7238` | CTA hover states |

### 2.2 Backgrounds and Surfaces

| Token | Hex | Usage |
|---|---|---|
| Background | `#FEF9EF` | Main page background |
| Surface | `#FDF4EF` | Cards, panels, containers |
| Surface Alternative | `#E9E3DE` | Alternate backgrounds |
| Active | `#E6D5ED` | Selected navigation elements |
| Border | `#E9E3E0` | Subtle separators and borders |

### 2.3 Text Colors

| Token | Hex | Usage |
|---|---|---|
| Heading | `#3A2044` | Headings and key figures |
| Body | `#383B3D` | Main text |
| Muted | `#7B8285` | Secondary text, with contrast adjustments |
| Inverse | `#FFFFFF` | Text on dark backgrounds |
| CTA Text | `#311A08` | Primary button labels |

### 2.4 Semantic and Decorative Colors

| Token | Hex | Usage |
|---|---|---|
| Information | `#CCF7FD` | Information cards |
| Success | `#298E9C` | Success indicators and progress |
| Warm | `#F5C3A1` | Warm highlight cards |
| Peach | `#E3C49B` | Decorative accents |
| Lavender | `#E6D5ED` | Secondary highlight cards |

Use pastel colors primarily for surfaces and highlights, not for body text.

Do not introduce arbitrary colors when an existing token can serve the purpose.

## 3. CSS Design Tokens

Define reusable variables in the application's global stylesheet or theme configuration.

```css
:root {
  --color-primary: #3A2044;
  --color-primary-hover: #643B73;
  --color-sidebar: #665166;

  --color-secondary: #AF9AC9;
  --color-secondary-hover: #8D55A3;

  --color-accent: #EB8F48;
  --color-accent-hover: #BD7238;

  --color-background: #FEF9EF;
  --color-surface: #FDF4EF;
  --color-surface-alt: #E9E3DE;

  --color-heading: #3A2044;
  --color-text: #383B3D;
  --color-text-muted: #7B8285;
  --color-text-inverse: #FFFFFF;
  --color-button-text: #311A08;

  --color-border: #E9E3E0;
  --color-active: #E6D5ED;

  --color-info: #CCF7FD;
  --color-success: #298E9C;
  --color-warm: #F5C3A1;
  --color-peach: #E3C49B;
  --color-lavender: #E6D5ED;

  --font-family: 'Inter', system-ui, sans-serif;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;

  --spacing-unit: 8px;

  --shadow-card:
    0 4px 16px rgba(58, 32, 68, 0.06
    