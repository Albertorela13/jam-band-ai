# Rename: Jam Session → AskUsers

A pure rebrand pass. No layout changes, no functional changes — just naming, microcopy, the sidebar logo, and a new icon. Music metaphors swap for user‑research metaphors.

## Vocabulary swap (applied everywhere)

| Old (music) | New (research) |
|---|---|
| Jam Session / jam session | AskUsers / session |
| jam (noun, "the jam") | session / round |
| jamming | running a session |
| bandmate / bandmates | persona / personas (or "user" when natural) |
| stage (as in "your stage", "stepped off the stage") | panel |
| "Tune up" / "tuning up" | "Get ready" / "Setting up" |
| "Start the jam" | "Run session" |
| "Run a jam session" | "Run a session" |
| "Jam history" | "Session history" |
| "voices" (kept — already research-flavoured) | voices |

Cap of 6 personas stays — wording changes from *"Six bandmates max — any more and it stops being a jam session"* to *"Six personas max — keeps the panel focused."*

## New logo (sidebar)

Replace the round amber `Music2` icon + *"Jam Session"* Fraunces wordmark in `src/components/layout/AppSidebar.tsx` with a small inline SVG that mirrors the uploaded mark:

- A rounded speech-bubble face (smiling eyes + open smile) in `--foreground` stroke
- 5 short "spark" rays above it in the project palette: brick, coral, mustard, olive, ochre
- Wordmark next to it: **ASK** in `--foreground`, **USERS** in `--primary` (mustard), set in Fraunces uppercase, semibold, slight tracking — keeps the playful jam-jar feel and reuses the existing palette tokens (no new colors needed)
- Compact sizing so the collapsed sidebar shows just the bubble icon (same h-9 w-9 slot as today)

Updated `aria-label` → "AskUsers — go to Panel".

## File-by-file changes (copy / logo only — no logic)

**`index.html`**
- `<title>` → "AskUsers — stress-test features against your users"
- meta description → "Stress-test feature ideas against AI-powered user personas."
- og:title → "AskUsers", og:description → "Stress-test features against your users."

**`src/components/layout/AppSidebar.tsx`**
- Drop `Music2` import.
- Replace logo block with the new inline SVG bubble + spark rays + "ASK USERS" wordmark described above.
- aria-label updated.

**`src/pages/Index.tsx` (Panel)**
- Toast: *"Six personas max — keeps the panel focused."*
- CTA button: "Run a session"
- Subtitle: "Up to six user personas ready to react to your next feature."

**`src/pages/RunTest.tsx`**
- Drop `Music2` import; use `Sparkles` (already used elsewhere) for the run button icon — same warm tone, no music metaphor.
- "No bandmates yet" → "Your panel is empty"
- "Build at least one persona before running a jam session." → "Add at least one persona before running a session."
- "Run a jam session" → "Run a session"
- "Jam in progress…" → "Session in progress…"
- "Start the jam" → "Run session"
- Empty state CTA: "Create your first persona" (unchanged — already neutral)

**`src/pages/TestDetail.tsx`**
- "Loading the jam…" → "Loading session…"
- "That jam's gone missing" → "Session not found"
- "Run a new jam" → "Run a new session"
- "The jam" → "The feature" (header above the blockquote)
- "Run another jam" → "Run another session"

**`src/pages/HistoryPage.tsx`**
- Drop `Music2` import; use `Sparkles` for the run-new CTA.
- "Jam history" → "Session history"
- "Run a new jam" → "Run a new session"
- "No jams yet" → "No sessions yet"
- Empty body: "Run your first session and the panel's reactions will land here." (unchanged) / "Build a persona, then run a session — past sessions will live here."
- Empty CTA: "Start a session"

**`src/pages/PersonaEditor.tsx`**
- "Six bandmates max — any more and it stops being a jam session." (×2) → "Six personas max — keeps the panel focused."
- "{name} joined the panel." (unchanged — already research-y)
- "{name} stepped off the stage." → "{name} removed from your panel."
- "That persona has left the building." → "That persona isn't in your panel anymore."

**`src/components/panel/PanelEmptyState.tsx`**
- "Your stage is empty." → "Your panel is empty."
- "Add your first bandmate to start jamming." → "Add your first persona to start asking users."

**`src/components/panel/AddPersonaCard.tsx`**
- "Bring a new bandmate on stage." → "Add another voice to your panel."

**`src/components/panel/EmptyStageIllustration.tsx`** *(rename optional, keep file path stable)*
- Keep the file name (avoids churn in imports). Update the JSDoc comment + aria-label to "An empty panel with three open seats" and rename the inner "Jam jar" comment to "Center seat with a smiley speech bubble." Visual stays — the warm jar-on-a-seat motif still reads as a friendly empty-panel scene; no metaphor break.

**`src/components/settings/ApiKeyMissingDialog.tsx`**
- Title: "Pop in your API key to get jamming" → "Add your API key to start asking users"

**`src/components/settings/SettingsDialog.tsx`**
- Export filename: `jam-session-export-${date}.json` → `askusers-export-${date}.json`
- Import error: "Couldn't read that file. Is it a Jam Session export?" → "Couldn't read that file. Is it an AskUsers export?"

**`src/lib/storage.ts`**
- File header comment + `JamData` JSDoc → "AskUsers — localStorage data layer."
- **Storage key migration**: keep `ROOT_KEY = "askusers-data"` going forward, but on first read also fall back to the old `jam-session-data` key and migrate it transparently (read old → write new → delete old). Existing users' personas/tests/settings are preserved with zero action needed.
- The `JamData` *type* name stays (internal only — renaming is pure churn with no user-facing impact).

**`src/lib/avatar.ts`**
- JSDoc → "AskUsers" and the default seed fallback `"jam"` → `"askusers"`. Same DiceBear palette.

**`src/index.css`**
- Header comment "Jam Session design tokens." → "AskUsers design tokens."
- Inline note "No dark mode — Jam Session is cream-only by design" → "No dark mode — AskUsers is cream-only by design"

**Other passes**
- Any remaining "panel's weighed in" toast (`RunTest.tsx`) stays — already on-brand.
- No changes to: routes, component file names, types/interfaces, anthropic.ts logic, tailwind tokens, color palette, layout classes, or any prompts sent to Claude (those describe a "user persona" already — no music words there).

## Out of scope (per your instructions)
- No layout/structural changes
- No new pages or features
- No prompt or AI-behaviour tweaks
- No palette or typography changes
- No file renames (avoids import churn)

## After this stage
- Sidebar shows the new AskUsers mark + wordmark; collapsed view shows just the smiling-bubble icon
- Every visible string reads as user research, not music
- Existing localStorage data is auto-migrated — nobody loses their personas
- Browser tab title and OG metadata reflect the new name

I'll stop after applying these — let me know if you want any wording dialled differently before I touch the code.
