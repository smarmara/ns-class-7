# Native smoke test

Manual checklist for a native build, covering what automated tests cannot reach:
real safe areas, the software keyboard, the system share sheet, hardware Back,
and process death.

Run the whole list on **Android** and, when a Mac is available, on **iOS**.
Prefer a device with a notch or Dynamic Island for iOS and gesture navigation
for Android — those are where the layout assumptions bite.

Before starting:

```bash
pnpm native:doctor     # prerequisites
pnpm native:sync       # build, stamp, version, sync
pnpm native:verify     # dist is fresh and needs no network
```

Record the build: platform, OS version, device, app version, date.

---

## Launch and shell

- [ ] **Cold launch** — app opens from the launcher/home screen
- [ ] Splash appears and disappears **as soon as the app is ready** (not held)
- [ ] **No white flash** before dark mode applies (test with Dark selected)
- [ ] **Home renders** with content, not an error or empty state
- [ ] **No PWA update banner** appears at any point
- [ ] **No "works offline now"** notice appears
- [ ] No "Add to Home Screen" or install prompt anywhere

## Safe areas

- [ ] **Top** — header content clears the status bar / notch / Dynamic Island
- [ ] **Bottom** — nothing is hidden behind the home indicator or gesture bar
- [ ] **Bottom nav** — all five tabs fully tappable, none clipped by the gesture bar
- [ ] Rotate to landscape and back: no content trapped under a cutout
- [ ] **Quiz views** — question, options and Continue all reachable without
      awkward scrolling on the smallest supported screen

## Core learning

- [ ] **Learn opens** and lists topics with their states
- [ ] **Rules drill** — answer a question, feedback appears, explanation shown
- [ ] **Sign drill** — sign artwork renders (not a broken image)
- [ ] **Continue to next section** works from a completed section
- [ ] **Practise again** restarts cleanly
- [ ] **Achievement award** moment displays and can be dismissed
- [ ] **Practice Exam** — start, answer, submit, see per-section pass/fail
- [ ] **Sign Catalogue** — browse, images load, scrolling is smooth
- [ ] **Sign Match** — a full round is playable
- [ ] **Best streak** updates and persists

## Profile and appearance

- [ ] **Profile** opens and shows progress
- [ ] Edit **display name**: keyboard opens, the field stays visible, **Save is
      reachable**, bottom nav does not sit awkwardly over the keyboard
- [ ] **Appearance: Automatic** follows the system setting — change the device
      theme with the app open and confirm the app follows
- [ ] **Appearance: Light** — light surfaces, **dark status-bar icons**
- [ ] **Appearance: Dark** — dark surfaces, **light status-bar icons**
- [ ] Status bar colour matches the app surface in all three modes
- [ ] **Achievements** screen renders badges in their correct states

## Backup and restore

- [ ] **Backup export** — the system **share sheet** opens (not a silent no-op)
- [ ] Save the file somewhere retrievable (Files / Drive)
- [ ] Cancelling the share sheet shows **no error**
- [ ] **Backup restore** — the file picker opens and the saved file can be chosen
- [ ] Restoring reports success and progress reflects the backup
- [ ] A backup made in the **browser** restores in the **native app**
- [ ] A backup made in the **native app** restores in the **browser**

## Links and navigation

- [ ] **External source link** (Sources, or a question's citation) opens in the
      **system browser**, not inside the app's own WebView
- [ ] Returning from that browser puts the learner back where they were
- [ ] **Internal links** stay in the app — no hash route ever opens the browser
- [ ] **Android Back** from a nested screen goes back one step
- [ ] **Android Back** does not skip unpredictably between bottom-nav sections
- [ ] **Android Back** at Home exits the app
- [ ] **Android Back** after a completed topic / award / Sign Match result /
      Practice Exam result leaves the screen and does **not** reopen the
      finished session

## Lifecycle and persistence

- [ ] **Background / resume** mid-drill — the app returns in a sensible state
- [ ] **App relaunch persistence** — answer a question, force-quit, relaunch:
      progress, XP, medals, Profile, Appearance and Sign Match best streak all
      remain
- [ ] **Practice Exam** in progress survives background/resume
- [ ] Install an updated build over the top: **progress is preserved**

## Offline

- [ ] **Offline launch** — enable airplane mode, force-quit, relaunch: the app
      opens normally
- [ ] Offline: Learn, a Rules drill, a Sign drill, Sign Catalogue, Sign Match,
      Profile and Achievements all work
- [ ] Offline: sign images still render
- [ ] Offline: tapping an external source link fails gracefully (it is expected
      to need a network — it must not crash or wedge the app)

## Tablet and orientation

- [ ] Tablet width: layout does not stretch into an absurd full-width line length
- [ ] Portrait is the primary experience and is thoroughly usable
- [ ] Landscape does not break layout (orientation is intentionally not locked)

## Accessibility

- [ ] Screen reader (TalkBack / VoiceOver) reads questions and options in order
- [ ] Buttons announce as buttons with meaningful labels
- [ ] Correct/incorrect feedback is conveyed by **text**, not colour alone
- [ ] Achievement states are announced textually
- [ ] Appearance controls are reachable and announced
- [ ] Large system font size does not clip critical UI

## Privacy

- [ ] With a network monitor attached, ordinary study (Home, Learn, quiz, Sign
      Match, Profile, Achievements) produces **no outbound requests**
- [ ] The **Privacy** section is present and accurate on the Sources page
- [ ] The independence disclaimer is visible and no government logo appears

---

## Result

| | |
| --- | --- |
| Platform / OS | |
| Device | |
| App version | |
| Content version | |
| Date | |
| Pass / fail | |
| Notes | |
