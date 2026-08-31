# Fix AI date accuracy and make the assistant fully capable

## The bug

The assistant decides "today" on the server, which runs in UTC. Yesterday evening (7pm Pacific) the server already considered it the next calendar day, so anything you logged went onto tomorrow's date. Anything logged after ~5pm Pacific lands on the wrong day.

## Fix: one source of truth for the date

- The chat request sends your actual local date (and timezone) along with the message.
- The assistant uses that date for the snapshot ("TODAY: ...") and as the default for every tool that writes a dated record — points, habits, work shifts, transactions, tasks, events, daily logs.
- Relative words are resolved from that same date: "yesterday", "today", "tomorrow", "last Friday".
- Every dated write echoes the date back in the reply ("logged Fitness +20 on Aug 30") so a wrong day is visible immediately.
- The rest of the app also uses one shared local-date helper so Today, the calendar, and streaks never disagree with the assistant.

## Fix: wrong-day recovery

Add a "move it to <date>" capability so you can say "that was yesterday" and the assistant re-dates the entries and recomputes both days' scores instead of you fixing rows by hand.

## Make the assistant capable across the whole app

Audit the tool set and fill the gaps so anything visible in the UI can be done by talking. Current coverage: tasks, habits, work shifts, transactions, balances, goals, events, projects, daily log, points, targets, categories, suggestions. Additions:

- Classes / school schedule: add, edit, remove.
- Project sub-steps and status for the room move and other projects.
- Habit pause/resume/delete and back-dated habit logging.
- Delete/correct any transaction or shift (not just add).
- Read-back questions answered from real stored data: "how many points do I have this week", "what's my vape streak", "how much did I make this week", "what's left before Sept 4".

## Accuracy rules

- After any points change, recompute and save that day's score immediately (and the source day too when an entry moves).
- Never invent numbers; if a value isn't stored, the assistant says so and offers to record it.
- Batch multi-part messages ("I ran 3 miles, worked 4 hours, and paid $12 for gas") into all the right writes in one turn, then summarize each change with its date.
- Ambiguous dates get a one-line confirmation instead of a guess.

## Technical notes

- `todayKey()` in `src/lib/aichat.server.ts` uses server `new Date()`; replace with a client-supplied `localDate` + `timeZone` in the `sendChatMessage` validator, threaded through `buildSnapshot` and `runTool`.
- Keep `src/lib/lifeos.ts` `toKey/todayKey` as the single client-side date helper; the chat panel passes its result.
- New tools added to the existing tool array/switch in `aichat.server.ts`; day-score recompute reuses the existing upsert path.
- Verify by logging an activity in the preview during the evening window and confirming it appears on the correct calendar day.
