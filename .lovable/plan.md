# Move AI Assistant into the Today Page

## Goal
Remove the AI chat as a separate tab and embed it directly in the Today page (the main page), so Logan can tell the assistant what happened without leaving the dashboard.

## Changes

### 1. Embed chat in Today page (`src/routes/index.tsx`)
- Extract the existing chat UI from `src/routes/chat.tsx` into a reusable component `src/components/lifeos/ChatPanel.tsx` (same logic: message history from `chat_messages`, `sendChatMessage` server fn, prompt suggestions, busy state).
- Render it on the Today page below the DayPoints section, inside the existing panel styling — compact height (e.g. ~40vh) so the dashboard stays primary.
- After each send, call the existing life-data refresh so points/scores update inline (this already happens via `useRefreshLife`).

### 2. Remove the chat tab
- Delete `src/routes/chat.tsx`.
- Remove the "AI" nav item from `AppShell.tsx` (both desktop nav and mobile bottom nav — bottom nav becomes a single row of 5... actually 8 items remain, so mobile keeps the two-row 5+3 grid).

## Technical details
- Reuse existing: `sendChatMessage` server function, `chat_messages` table, `useLifeData`/`useRefreshLife`, Panel component, sonner toasts.
- No database changes.
- Head metadata for `/` stays as-is; chat route metadata is removed with the route.

## Verification
- `tsgo` typecheck passes, build log shows OK.
- Browser check: Today page renders chat panel, sending a message updates points inline; `/chat` no longer exists in nav.
