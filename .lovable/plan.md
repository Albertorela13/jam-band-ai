
# Stage 1 — Foundations

Locking in the visual + structural skeleton before any features. After this stage you'll see an empty but warmly-themed app with the sidebar, all six routes registered (placeholders), and a complete localStorage utility ready to use.

## What I'll build

**Theme (`src/index.css` + `tailwind.config.ts`)**
- All palette colors as HSL CSS variables: cream `#FBF7F0` background, warm-near-black `#2A2520` foreground, mustard `#F4B940` primary, coral `#E8725C` secondary, olive `#6B8E4E` success, ochre `#D99B3A` warning, brick `#C75146` destructive, warm grey `#6B6459` muted-foreground, hairline `#E8DFD0` border, `#F5EFE3` subtle fill.
- Custom shadow utility `shadow-warm` → `0 4px 20px rgba(42, 37, 32, 0.06)`.
- Custom transition timing `ease-bounce` → `cubic-bezier(0.34, 1.56, 0.64, 1)`.
- Border radius bumped: cards 14px, buttons 10px, pills 24px (via Tailwind extensions, leaving shadcn defaults intact where needed).
- `body` defaults to Inter; `.font-display` class applies Fraunces.

**Fonts (`index.html`)**
- Google Fonts link for Fraunces (400/500/600, italic) + Inter (400/500/600).
- Update page title + meta description to reflect Jam Session.

**Storage util (`src/lib/storage.ts`)**
- Single root key `jam-session-data`.
- TypeScript types: `Persona`, `TestResult`, `Test`, `Settings`, `JamData`.
- Helpers: `getPersonas`, `savePersona` (insert or update by id, enforces 6-cap with throw), `deletePersona`, `getTests`, `saveTest`, `getTest(id)`, `getSettings`, `saveSettings`, `exportAll`, `importAll` (merge by id), `resetAll`.
- Lazy-init with empty arrays + default settings (`model: "claude-sonnet-4-6"`, empty key) on first read.

**App shell**
- `src/components/layout/AppSidebar.tsx` — collapsible shadcn sidebar. Wordmark "Jam Session" in Fraunces bold italic + small `Music2` icon in amber. Nav items: Panel (`/`), History (`/history`). Settings as a button that opens a placeholder modal (real content in Stage 3). Footer tagline: "Stress-test features against your personas."
- `src/components/layout/AppLayout.tsx` — wraps sidebar + main area, max-width 1200px, `p-8` minimum, header strip with `SidebarTrigger` always visible.
- `src/App.tsx` — `BrowserRouter` with all six routes registered, all wrapped in `AppLayout`:
  - `/` → Panel (placeholder: "Panel coming next")
  - `/persona/new` and `/persona/:id` → placeholder
  - `/test/new` and `/test/:id` → placeholder
  - `/history` → placeholder
  - `*` → existing `NotFound`

**Tiny helper (`src/lib/avatar.ts`)**
- `getAvatarUrl(seed)` returning the DiceBear lorelei URL with the warm background palette. Used everywhere from Stage 2 onward.

## What you'll review after Stage 1
- Cream background + warm shadows feel jam-jar, not SaaS-grey
- Fraunces wordmark reads playful, Inter body reads clean
- Sidebar collapses cleanly, Settings button opens a stub
- All six routes load placeholders without errors
- (Under the hood) localStorage util works — I'll verify by writing/reading a dummy persona in dev tools before handing off

Nothing is wired to AI yet. No persona cards, no editor, no test runner — those come in Stages 2, 4, and 5 respectively.

I'll pause here for your review before starting Stage 2 (Panel screen).
