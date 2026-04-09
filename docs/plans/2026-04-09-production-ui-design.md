# Production UI Redesign — Design Document
**Date:** 2026-04-09  
**Style:** Canva-inspired, soft gradient, frosted glass

---

## Color System

| Token | Value | Usage |
|---|---|---|
| Page background | `135deg, #f5f3ff → #faf5ff → #ffffff` | Full-page gradient |
| Canvas background | `#f8f7ff` | Editor canvas area |
| Canvas dot grid | `violet-100` radial dots | CSS background pattern |
| Primary accent | `violet-600` (#7C3AED) | Buttons, active states, icons |
| Primary gradient | `from-violet-600 to-purple-600` | Logo badge, primary CTA hover |
| Text primary | `gray-900` | Headings, labels |
| Text secondary | `gray-500` | Subtitles, descriptions |
| Text hint | `gray-400` | Placeholder text |
| Header bg | `bg-white/80 backdrop-blur-md` | Frosted glass header |
| Sidebar bg | `bg-white/70 backdrop-blur-xl` | Frosted glass sidebar |
| Mobile bottom bar | `bg-white/80 backdrop-blur-xl` | Frosted glass bottom bar |

---

## Typography

**Font:** DM Sans (Google Fonts) — weights 400, 500, 600  
Replace current Geist in `app/layout.tsx`.

| Role | Style |
|---|---|
| App name | DM Sans 600, `text-sm` |
| Page heading | DM Sans 600, `text-lg` |
| Section labels | DM Sans 600, `text-[11px]` uppercase tracking-widest, `text-violet-500` |
| Body | DM Sans 400, `text-sm` |
| Button | DM Sans 600, `text-xs` |

---

## Transitions & Motion

- All interactive elements: `transition-all duration-200 ease-out`
- Phase changes (idle → detecting → cropping): `opacity-0 → opacity-100` over 300ms using `animate-fadeIn` (custom keyframe)
- Export button while exporting: `animate-pulse`
- Drag-over upload zone: scale `1.01`, border color shift — `transition-all duration-150`
- Aspect ratio button activation: immediate color fill with `duration-150`

---

## Component Specs

### Header
- `h-14 bg-white/80 backdrop-blur-md border-b border-white/60 shadow-sm`
- Logo badge: `w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600`
- App name: DM Sans 600
- Export button: `bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/25 rounded-lg px-4 py-1.5`

### Upload Zone
- Page: lavender gradient background, content centered
- Card: `rounded-3xl border-2 border-dashed border-violet-200 bg-violet-50/50`
- Drag-over: `border-violet-500 bg-violet-50 scale-[1.01]`
- Icon container: `w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600`
- Icon: white, `w-6 h-6`
- "Browse files" span: `text-violet-600 font-semibold underline-offset-2`
- Error: `text-red-500`

### Canvas Area
- Background: `bg-[#f8f7ff]` with dot-grid pattern via CSS `radial-gradient`
- Image shadow: `shadow-2xl shadow-black/20`
- `react-image-crop` border/handles styled to violet where possible

### Sidebar (desktop, `w-64`)
- `bg-white/70 backdrop-blur-xl border-l border-white/50 shadow-xl shadow-violet-100/30`
- Section label: `text-[11px] font-semibold text-violet-500 uppercase tracking-widest`
- Aspect button inactive: `border border-violet-100 text-gray-500 hover:border-violet-300 hover:text-violet-600`
- Aspect button active: `bg-violet-600 text-white shadow-md shadow-violet-500/30`
- Reset button: `border border-violet-200 text-violet-600 hover:bg-violet-50`

### Detecting State
- Spinner: `text-violet-500`
- Label: violet-tinted pill background

### Mobile Bottom Bar
- `bg-white/80 backdrop-blur-xl border-t border-white/40`
- Aspect pills: same active/inactive as sidebar
- Export: solid violet, full-width minus reset

---

## Files to Modify

| File | Change |
|---|---|
| `app/layout.tsx` | Swap Geist → DM Sans, add fadeIn keyframe to globals.css |
| `app/globals.css` | Add `@keyframes fadeIn`, dot-grid CSS utility |
| `app/page.tsx` | Apply all new classes, gradient bg, phase fade transitions |
| `components/UploadZone.tsx` | Violet upload zone redesign |
| `components/CropEditor.tsx` | Violet canvas bg, shadow on image |
| `components/Toast.tsx` | Violet success toast, keep red for error |
