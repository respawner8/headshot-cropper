# Headshot Cropper — Design Document
**Date:** 2026-04-09  
**Stack:** Next.js 14+, React, TypeScript, Tailwind CSS

---

## Overview

A single-page Next.js application that lets a user upload a portrait photo, receive an AI-generated crop suggestion (via face-api.js with heuristic fallback), interactively adjust the crop, and export the result client-side.

---

## Architecture

Single-page app (`app/page.tsx`) with no routing and no backend. All processing runs client-side.

```
app/
  page.tsx              # root page, manages phase + image state
  layout.tsx            # minimal shell, Tailwind base
components/
  UploadZone.tsx        # drag-drop + file picker, validation
  CropEditor.tsx        # react-image-crop wrapper + aspect lock + reset
  ExportButton.tsx      # canvas crop + browser download trigger
  Toast.tsx             # success toast after export
lib/
  suggestCrop.ts        # face-api.js detection + heuristic fallback
  exportImage.ts        # canvas crop logic + blob download
```

---

## Data Flow

```
User drops/selects file
  → validate (JPEG/PNG/WebP, max 10MB)
  → create object URL → store as imageUrl
  → render <img> + pass to face-api.js
  → detectSingleFace() → bounding box
    → if face found: center 3:4 crop on face
    → if no face: heuristic (upper-center third, 3:4 ratio)
  → set aiCrop
  → render CropEditor with aiCrop as initial crop
  → user drags/resizes → updates currentCrop
  → "Reset to AI Suggestion" → currentCrop = aiCrop
  → "Export" → Canvas draw at currentCrop → download JPEG
```

### State shape (`page.tsx`)

```ts
imageUrl: string | null
imageSize: { width: number; height: number } | null
aiCrop: Crop | null          // from face-api.js or heuristic
currentCrop: Crop | null     // user-adjusted
phase: 'idle' | 'detecting' | 'cropping' | 'done'
aspectLock: '1:1' | '3:4' | '4:5' | 'free'
```

---

## UI / UX

**Layout:** Centered `max-w-3xl` container, white background, clean/minimal aesthetic.

**Idle:** Large dashed upload zone with cloud icon, "Drag & drop or click to upload", accepted formats and size limit shown below. Inline error replaces hint text on validation failure.

**Detecting:** Thumbnail renders immediately. Spinner overlay with "Analyzing face…" while face-api.js loads model and runs detection.

**Cropping:** Full-width image with `react-image-crop` overlay — dark semi-transparent mask outside crop, white corner/edge handles. Controls below: aspect ratio toggle (Free / 1:1 / 3:4 / 4:5), "Reset to AI Suggestion" ghost button, primary "Export Cropped Image" button.

**Export:** Client-side Canvas crop, browser download triggered. Success toast bottom-right: "Image exported successfully".

**Responsive:** Image fills full width on tablet, controls stack below. Touch drag/resize supported via react-image-crop.

**Accessibility:** Upload zone has `role="button"` + keyboard Enter/Space. All buttons have `aria-label`. Toast has `role="status"`.

---

## Error Handling

| Scenario | Handling |
|---|---|
| Wrong file type | Inline error: "Only JPEG, PNG, and WebP are supported." |
| File > 10MB | Inline error: "File must be under 10 MB." |
| face-api.js model load fails | Silent fallback to heuristic crop |
| No face detected | Silent fallback to heuristic crop |
| Canvas export fails | Console error + user-facing toast error |

---

## Key Libraries

| Library | Purpose |
|---|---|
| `react-image-crop` | Interactive crop overlay (drag, resize, touch) |
| `face-api.js` | Client-side face detection (SSD MobileNet model via CDN) |
| `tailwindcss` | Styling |

---

## Git Setup

Initialize a git repository at project root. Initial commit includes scaffolded project + this design doc.
