# Custom-TA v2 Guidelines (for AI + Humans)

This document is the single source of truth for UI/UX + implementation conventions in **Custom-TA v2**.

Keep it short and strict. Prefer **clear defaults + explicit exceptions**.

## Non‑negotiables (Top rules)

- **Workspace layout is always 3 columns**
  - **Left**: Profile / Quest Panel
  - **Center**: AI Chat
  - **Right**: Notes / Materials
- **Separation of concerns**: UI (presentational) vs state vs data access (hooks/services) must be separated.
- **Reusable first**: prefer reusable components over inline implementations; avoid duplicates.
- **Small files**: avoid large components (target max ~300 lines). If it grows, split UI, hooks, and helpers.
- **Functional components + hooks only**.
- **TypeScript strict**: no `any` unless truly unavoidable.
  - Prefer `unknown` + type guards and narrow types.
- **No dead UI**: every button must do something and provide feedback (toast/modal/state change).
- **Always handle states**: loading, empty, error for every data-driven view.

## Project structure & boundaries

- **UI components**: pure rendering + props, no fetching.
- **Hooks**: state + side effects + view-model logic (formatting/derived state allowed).
- **Services**: API/network logic only (request/response mapping, error normalization).
- **Types**: domain schemas and shared types live in a dedicated place (do not redefine ad-hoc per feature).

## Layout guidelines

- **Default layout**: Flexbox + Grid.
- **Avoid absolute positioning** except overlays (modal, tooltip/popover).
- **Spacing scale**: 8px base unit (use design tokens / utility classes, not arbitrary values).
- **Readable widths**: use max-width containers for long text and dense content (e.g., `max-w-7xl`).
- **Responsiveness**:
  - Maintain the 3-column mental model.
  - On small screens, collapse side panels into tabs/drawers rather than breaking the information architecture.

## Design system guidelines

### Color usage

- **Primary**: `#37b1b1`
- **Primary hover**: `#2a9090`
- **Background dark gradient**: `#071f1f` → `#0d4545`
- **Card surfaces**: light variants like `#f0fdfd`, `#e0f7f7`

### Typography

- **Base font-size**: 14px
- **Titles**: `font-semibold` / `font-bold`
- Avoid overly large headings; keep hierarchy subtle.

### UI style & interaction

- **Corners**: soft rounded corners (`rounded-2xl`)
- **Shadows**: subtle only (`shadow-md` or less)
- Avoid heavy borders; prefer background contrast.
- All clickable elements must have **hover + transition**.
- Use consistent animation duration (**200ms**).

## Component guidelines

### Buttons

- **Primary**: main action only (max 1 per section)
- **Secondary**: outlined
- **Tertiary**: text-only

### Cards

Use cards for grouped content. Every card must have:

- padding (`p-4` or `p-6`)
- `rounded-2xl`
- subtle shadow

### Modals

- Always centered
- Backdrop blur
- Max width `md` or `lg`

### Forms

- Validation is required
- Inline error messages required
- Disabled and loading states required for submit actions

## State & data guidelines

- Use `useState` for local UI state.
- Use context/global store only when it reduces prop drilling meaningfully.
- Keep API logic out of UI components (use hooks/services).
- Mock data must follow realistic domain schema.

### Domain models (minimum vocabulary)

- **Student**
- **Course**
- **Quest**
- **ChatMessage**

## UX guidelines

- Always show **loading** state (skeleton/spinner).
- Always handle **empty** state with clear copy:
  - “No quests yet”
  - “Upload your first lecture material”
- Always handle **error** state with a recovery path (retry / guidance).

## AI interaction guidelines

- Always show the **source** of AI answers (document/material reference).
- Clearly distinguish:
  - **AI generated content**
  - **Instructor content**
- Chat must support:
  - message grouping (by sender / topic)
  - optional streaming UI (partial updates)
- AI responses should be concise and structured (prefer bullet points).

## Chart guidelines

- Use **Recharts only**.
- Avoid too many colors (max 3).
- Always include tooltip.
- Add legend only when it improves clarity.

## Anti‑patterns (DO NOT)

- Do not use inline styles.
- Do not duplicate components (extract and reuse).
- Do not ignore responsiveness.
- Do not skip loading / empty / error states.
- Do not hardcode arbitrary spacing; use the spacing scale/tokens.

## Exceptions

If a rule must be broken, document the reason in the PR/commit or the task description (short and explicit).
