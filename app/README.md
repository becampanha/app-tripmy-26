# Cronograma de Viagem

React + Vite PWA implementing the "Cronograma Dia" screen designed in Claude
Design (see `../project/Cronograma Dia.dc.html` and `../chats/chat1.md` for
the original design source and rationale).

## Develop

```
npm install
npm run dev
```

## Build

```
npm run build
npm run preview
```

## Structure

- `src/data/itinerary.json` — the 19-day Orlando itinerary (date, weekday,
  day theme, activities). Edit this file to change the schedule content.
- `src/components/ScheduleScreen.jsx` — the main screen: fixed background
  photo, day tabs, sticky schedule panel that slides over the photo on
  scroll, activity list, bottom tab bar.
- `src/hooks/useBackgroundPhoto.js` + `src/db/photoStore.js` — the
  background photo is a real upload, persisted per-browser in IndexedDB
  (survives reloads; there is no backend, so it's local to the device).
  Falls back to the default Unsplash photo (with required credit) until
  replaced.
- `src/components/PhotoControls.jsx` — the upload/remove/drop-to-replace
  controls for the background photo, layered so they stay clickable above
  the scrollable schedule panel without blocking day-tab taps or the
  scroll-to-reveal gesture.

## Known simplifications vs. the design prototype

- The "Lugares" tab only toggles its own active/inactive visual state, same
  as the current design — no screen exists behind it yet (see chat: "Lugares
  ainda só visual, sem tela própria ainda").
- No map / Google Places integration yet — deferred in the design chat to
  the build phase (needs a server-side API key), and out of scope for this
  screen.
- Full-image drag-and-drop for the background photo isn't wired (the drop
  zone is the thin control strip at the very top); tap-to-upload is the
  primary and most reliable path, especially on mobile.
