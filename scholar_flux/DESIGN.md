# Design System Specification

## 1. Overview & Creative North Star: "The Architectural Navigator"

This design system is built to transform the complex, often chaotic university environment into a seamless, high-end digital experience. Our Creative North Star is **The Architectural Navigator**. We move away from the "app-as-a-utility" look and toward "app-as-a-blueprint"—a sophisticated, airy, and layered interface that mimics the physical depth of a modern campus.

To achieve an award-winning editorial feel, we reject the rigid, boxed-in layouts of standard SaaS products. Instead, we utilize **intentional asymmetry**, **overlapping glass surfaces**, and **extreme typographic contrast**. By prioritizing negative space over structural lines, we create an interface that feels less like a database and more like an intelligent, living map.

---

## 2. Color & Tonal Depth

Our palette is anchored in a deep, academic blue balanced by tech-forward, airy neutrals. We avoid "flatness" by using a sophisticated hierarchy of surface containers.

### The "No-Line" Rule
**Explicit Instruction:** You are prohibited from using 1px solid borders to section off content. Physical boundaries must be defined exclusively through background color shifts or tonal transitions. For example, a `surface-container-low` section should sit on a `surface` background to denote its boundary.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked layers. Each tier provides a natural lift:
- **Base Level:** `surface` (#f8f9fa) – Used for the primary canvas.
- **Section Level:** `surface_container_low` (#f3f4f5) – Used for large content blocks.
- **Component Level:** `surface_container_lowest` (#ffffff) – Reserved for the most interactive elements (cards, inputs) to make them "pop" against the background.

### The Glass & Gradient Rule
To move beyond a standard UI, use **Glassmorphism** for floating elements (e.g., navigation bars, active map overlays). 
- Use semi-transparent variants of `surface_container_lowest` (e.g., 80% opacity) with a `backdrop-blur` of 12px to 20px.
- **Signature Texture:** Primary CTAs should use a subtle linear gradient from `primary` (#003fb1) to `primary_container` (#1a56db) at a 135-degree angle. This adds a "soul" to the color that flat hex codes cannot achieve.

---

## 3. Typography: Editorial Authority

We use **Inter** to convey modern precision. The hierarchy is designed to be dramatic—large, bold headers paired with airy, spacious body text.

| Role | Weight | Size | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display LG** | Bold (700) | 3.5rem | -0.02em | Hero headers, room numbers |
| **Headline MD** | SemiBold (600) | 1.75rem | -0.01em | Section headers |
| **Title SM** | Medium (500) | 1.0rem | 0 | Card titles, navigation |
| **Body MD** | Regular (400) | 0.875rem | +0.01em | General info, descriptions |
| **Label SM** | Bold (700) | 0.6875rem | +0.04em | Navigation labels, tags (All Caps) |

**Editorial Note:** Use `display-lg` sparingly to create "Moments of Impact." Don't be afraid of large white spaces around headlines; it signals premium quality.

---

## 4. Elevation & Depth: Tonal Layering

We convey hierarchy through **Tonal Layering** rather than traditional drop shadows.

- **The Layering Principle:** Place a `surface_container_lowest` card on a `surface_container_low` section to create a soft, natural lift. This mimics fine paper or frosted glass sheets stacked on a desk.
- **Ambient Shadows:** For floating elements (Modals, Hover states), use extra-diffused shadows. 
    - **Value:** `0px 12px 32px`
    - **Color:** `on_surface` (#191c1d) at **4% to 8% opacity**. This mimics natural ambient light.
- **The "Ghost Border" Fallback:** If a border is required for accessibility, it must be a "Ghost Border." Use `outline_variant` at **15% opacity**. Never use 100% opaque borders.
- **Glassmorphism:** Navigation menus should utilize `surface_tint` at a very low opacity (5%) combined with high blur to create a "smart lens" effect over the map interface.

---

## 5. Components

### Buttons
- **Primary:** Gradient from `primary` to `primary_container`. Rounded corner `xl` (1.5rem). No shadow, unless hovered.
- **Secondary:** `secondary_container` background with `on_secondary_container` text.
- **Tertiary:** No background. Text-only with an icon. Use for low-priority actions like "View Details."

### Navigation Bar (Floating)
- A floating glass bar at the bottom of the screen.
- Background: `surface_container_lowest` at 85% opacity with `backdrop-blur`.
- Active State: A subtle `primary_fixed` glow behind the active line-icon.

### Cards & Lists
- **Rule:** Forbid the use of divider lines.
- Separate list items by using a 12px vertical gap (`md` spacing) or by alternating background tones between `surface` and `surface_container_low`.
- Cards must use the `lg` (1.0rem) or `xl` (1.5rem) corner radius.

### Input Fields
- Avoid a "box" look. Use a filled style with `surface_container_highest` (#e1e3e4). 
- Bottom-only indicator: Instead of a full border, use a 2px `primary` line that expands from the center when the field is focused.

### Map Wayfinding Markers
- Use `tertiary` (#852b00) for "You Are Here" or high-priority alerts to create a sophisticated contrast against the cool blues.

---

## 6. Do’s and Don'ts

### Do
- **Do** use intentional asymmetry. A map can bleed off the edge of the screen while a content card is inset.
- **Do** use large "Safe Areas" of white space to prevent the UI from feeling claustrophobic.
- **Do** use line-based icons with a 1.5px or 2px stroke weight to match the Inter typography weight.

### Don't
- **Don't** use pure black (#000000) for text. Always use `on_surface` or `on_surface_variant`.
- **Don't** use standard "Material Design" shadows. Keep them diffused and tinted blue-gray.
- **Don't** use 1px dividers. If you feel the need to separate, use a background color shift or increase the spacing.
- **Don't** use sharp corners. Everything in this system should feel approachable and tech-forward through `lg` and `xl` radii.

---

## 7. Iconography & Interaction
- **Style:** 24px grid, 2px stroke weight, rounded caps.
- **Key Icons:** Use the "Stairs" and "Elevator" icons as primary wayfinding toggles. These should be housed in a `secondary_fixed` circular container when inactive, switching to `primary` when active.
- **Interaction:** All transitions should use a "Slightly Overshot" easing (Cubic Bezier 0.34, 1.56, 0.64, 1) to give the UI a responsive, springy startup feel.