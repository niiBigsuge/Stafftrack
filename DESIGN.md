# Design System & UI Craft Specification: StaffTrack

**System Archetype:** Clean Operational SaaS (Derived from Cal.com + Linear design principles)  
**Standard:** Olives Dev-OS `anti-ai-ui` craft standard  
**Status:** APPROVED  

---

## 1. Visual Hierarchy & Palette

### Base Surfaces & Elevation
StaffTrack avoids pitch-black glassmorphism, floating gradient orbs, and generic indigo-purple gradients. It employs a physical 3-tier elevation system:
* **Base Canvas (`--surface-canvas`):** `#ffffff` (Clean white workspace) / Dark: `#0c0d0e`
* **Surface Card (`--surface-card`):** `#f8f9fa` (Subtle warm neutral card floor) / Dark: `#151618`
* **Elevated Surface (`--surface-elevated`):** `#ffffff` with `border border-slate-200 shadow-sm` / Dark: `#1c1e21`
* **Hairline Dividers (`--hairline`):** `1px solid #e2e8f0` (Slate-200) / Dark: `#27272a`

### Operational Status Palette (WCAG AA Compliant)
Punctuality statuses are clear, semantic, and accessible:
* **On-Time / Present:** Emerald `#059669` (Dark text `#064e3b`, background `#ecfdf5`, border `#a7f3d0`)
* **Late:** Amber `#d97706` (Dark text `#78350f`, background `#fffbeb`, border `#fde68a`)
* **Absent:** Rose `#e11d48` (Dark text `#881337`, background `#fff1f2`, border `#fecdd3`)
* **On Leave / Excused:** Slate/Sky `#0284c7` (Dark text `#075985`, background `#f0f9ff`, border `#bae6fd`)
* **Brand Primary CTA:** Deep Ink `#0f172a` (Hover `#1e293b`, Active depression `active:scale-[0.98]`)

---

## 2. Typography

* **Display & Headline Font:** `Inter`, `-apple-system`, `sans-serif` (Weight 600, negative letter-spacing `-0.02em` for modern precision).
* **Body & UI Font:** `Inter`, `sans-serif` (Weight 400 & 500, clean tabular numbers with `font-variant-numeric: tabular-nums`).
* **Timestamp & Metric Font:** Monospace tabular numbers `JetBrains Mono`, `ui-monospace` for clock widgets, punch logs, and lateness minutes.

---

## 3. Component Affordances & Anti-AI Standards

1. **Vector-Only Functional Icons:** 100% Lucide SVG icons (`Clock`, `CheckCircle2`, `AlertCircle`, `Calendar`, `Building2`, `Filter`, `Download`, `UserCheck`). Zero raw emojis (`⏰`, `🚀`, `🔥`) in functional UI. Zero decorative sparkle icons.
2. **Tactile Interaction:**
   - Buttons visibly depress on click: `active:scale-[0.98] transition-transform duration-100`.
   - Focus rings: `focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2`.
   - Clickable table rows: `cursor-pointer hover:bg-slate-50 transition-colors`.
3. **Data-Dense Operational Tables:**
   - Sticky headers for daily attendance roster.
   - Distinct status pill badges with semantic border and text contrast.
   - Tabular numeric alignment for times (`08:24:12 AM`) to prevent visual jitter.
4. **Authentic Domain Entities:**
   - Realistic departments: "Core Engineering", "Enterprise Sales", "Customer Operations", "Human Resources".
   - Realistic employee IDs: `EMP-0104`, `EMP-0219`.
   - Realistic reasons for tardiness: "Transit delay on Metro Line 2", "Client emergency call prior to arrival", "Medical appointment with certificate".
5. **Contextual Navigation & Header:**
   - Integrated profile menu with employee code, department badge, and keyboard-accessible actions.
   - Clean horizontal sub-navigation with pill highlights.
