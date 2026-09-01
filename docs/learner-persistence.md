# Learner progress persistence

This note describes how learner progress is stored. It was written as part of the
"private local progress saving" task: the first half records what existed before
the change, the second half records the new architecture.

## Before: how progress was stored

Persistence was split across three hand-written paths, each calling browser
storage APIs directly. There was no shared abstraction, no versioned envelope and
no backup/restore.

### What existed before

| Learner state | Where | Key | Written from |
| --- | --- | --- | --- |
| Question attempts, per-question stats, mistakes queue, bookmarks, mock-test history, streak | IndexedDB (`idb-keyval`), localStorage fallback | `ns-class7:progress:v1` | `useProgress` (zustand) |
| XP, daily goal, daily XP log | IndexedDB (`idb-keyval`), localStorage fallback | `ns-class7:engagement:v1` | `useEngagement` (zustand) |
| In-progress mock session (questions, answers, clock) | localStorage only (synchronous) | `ns-class7:mock-session:v1` | `useMockExam` (zustand) |

### How it behaved

- **Progress** and **engagement** each had a `version` field (`1`). Each store
  hydrated itself on app start (`useProgress.hydrate`, `useEngagement.hydrate`),
  wrote fire-and-forget on every meaningful action (answer, bookmark, mock
  recorded, XP earned, goal changed), and cleared on reset.
- **Mock sessions** were serialised synchronously to localStorage on every
  interaction so an abrupt refresh resumes the paper.
- **Migration** was a single forward-normalisation step (`migrate` /
  `migrateEngagement`) inside `src/store/persistence.ts` that spread an older
  payload over a fresh empty value.
- **Corrupt data**: unparseable progress/engagement silently started clean. The
  corrupt value was not preserved for diagnostics.
- **No backup, no restore, no content-version tagging, no account.**
- **Hydration**: the App rendered a "Loading your progress…" placeholder until
  both stores reported hydrated (no flicker), but each store read its own key
  independently.

### Gaps this task addresses

- one storage abstraction instead of store-to-API calls;
- a versioned envelope with `savedAt` and `contentVersion`;
- automatic save after every meaningful change, batched in one envelope;
- migration of the existing flat keys into the new envelope (deterministic,
  idempotent, preserves data);
- corrupt-state preservation and a clean recovery path;
- backup to a JSON file and validated restore;
- privacy copy and "Saved on this device" status.

## After: the learner-storage layer

### Layers

```text
application state (useProgress, useEngagement, useMockExam)
      |
learner storage API (src/store/learnerStorage.ts)
      |
device storage (src/store/persistence.ts raw I/O)
      |
Web: IndexedDB + localStorage   |   future: iOS/Android native storage
```

`learnerStorage.ts` exposes a small device-boundary interface:

```ts
interface LearnerStorage {
  load(): Promise<string | null>;   // raw JSON string
  save(json: string): Promise<void>;
  clear(): Promise<void>;
}
```

The web implementation stores under the single key `ns-class7:learner:v1`
(IndexedDB primary, localStorage mirror). A future native build can supply the
same interface without touching the learning system.

### Envelope

```ts
interface PersistedLearnerState {
  format: 'ns-class7-progress';
  schemaVersion: 1;
  savedAt: string;
  contentVersion: string;
  progress: Progress;       // existing learner history (questions, attempts, mockTests, streak)
  engagement: Engagement;   // existing XP / daily goal / daily log
}
```

`progress` and `engagement` reuse the application's existing shapes unchanged.
The in-progress mock session stays in its own synchronous localStorage key
(`ns-class7:mock-session:v1`) so the existing safe recovery behaviour is
unchanged — no conflicting copy is created.

### What saves automatically

Every meaningful action now writes the combined envelope:

- answering a question (progress record, streak bump, XP award);
- bookmarking / unbookmarking / flagging for review;
- finishing a practice session (session-completion XP);
- completing a mock (mock history + mock-completion XP);
- changing the daily XP goal;
- reset (writes nothing, clears everything).

Writes are fire-and-forget and batched into one envelope so nothing is written
on React renders. A `pagehide`/`visibilitychange` listener flushes the latest
envelope synchronously to the localStorage mirror so a quick close right after
an answer does not normally lose it.

### Migration from the old flat keys

On launch the app reads the envelope first. If none exists it looks for the old
`ns-class7:progress:v1` and `ns-class7:engagement:v1` keys (IndexedDB then
localStorage), builds an envelope from them, saves it, then removes the old
keys. The old data is never deleted before the new envelope is written, and the
step is idempotent (after the first run the old keys are gone).

### Corrupt state

If the stored envelope cannot be parsed or validated, the raw text is preserved
under `ns-class7:corrupt:v1` for diagnostics, the learner starts with a fresh
recoverable state, and the Settings page still offers Restore and Reset. The
learner is never left in a broken app.

### Backup and restore

- **Back up progress** downloads `ns-class7-progress-YYYY-MM-DD.json` containing
  the envelope. It contains no name, email, IP, account id, tracking id or
  device identifier.
- **Restore progress** reads a file, verifies the format, validates the schema
  and the learner-state structure, and only after an explicit confirmation
  replaces the current progress (replace, never merge). Invalid files show a
  friendly message and leave current progress untouched.
- A backup whose `contentVersion` differs from the current questions is still
  restored: references to questions that no longer exist are ignored (readiness
  and mastery only count questions present in the active bank), and newly added
  questions begin unseen.

### Schema migration chain

`schemaMigrations` maps schema version to a normalising step. Version 1 is the
current version. Future format changes add a migration rather than requiring
backup invalidation.