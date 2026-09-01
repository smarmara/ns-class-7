# Native Application

How the Nova Scotia Class 7 study app is packaged for Android and iOS, and what
is different — and deliberately not different — from the web build.

The governing rule is that **React/Vite remains the application and Capacitor is
only the shell**. There is no second frontend, no forked learning logic and no
native storage layer. Native differences live at the edges: status bar, safe
areas, files, external links and system navigation.

---

## Architecture

```
React + TypeScript + Vite            the application (unchanged)
        │
        ├── dist/                    one production build, used by all three targets
        │
        ├── web / PWA                served over HTTP, service worker, installable
        ├── android/                 Capacitor shell, dist/ copied into the APK
        └── ios/                     Capacitor shell, dist/ copied into the .app
```

`src/native/` is the only native-aware code in the app. Every module in it is a
no-op on the web:

| File | Responsibility |
| --- | --- |
| `platform.ts` | The single answer to "are we native?" — plus `shouldRegisterServiceWorker()` and `shouldShowWebInstallUi()` |
| `statusBar.ts` | Maps the resolved appearance to a status-bar style and colour |
| `backButton.ts` | Android hardware/gesture Back |
| `externalLinks.ts` | Sends off-app links to the system browser |
| `backup.ts` | Browser download on web, share sheet on native |
| `index.ts` | `initNativeShell()` — wires the above once at start-up |

### Installed versions

| Package | Version |
| --- | --- |
| `@capacitor/core` | 8.5.0 |
| `@capacitor/cli` | 8.5.0 (dev) |
| `@capacitor/android` | 8.5.0 (dev) |
| `@capacitor/ios` | 8.5.0 (dev) |
| `@capacitor/assets` | 3.0.5 (dev) |
| `@capacitor/app` | 8.1.1 |
| `@capacitor/status-bar` | 8.0.3 |
| `@capacitor/splash-screen` | 8.0.2 |
| `@capacitor/browser` | 8.0.4 |
| `@capacitor/filesystem` | 8.1.3 |
| `@capacitor/share` | 8.0.1 |

Every plugin above has a concrete use. `filesystem` and `share` exist only to
make the backup export work in a WebView; `browser` only to stop source links
trapping the learner; `app` only for Android Back.

Capacitor 8 requires **Node >= 22**.

---

## App identity

All of it lives in one file, `app.identity.json`, read by `capacitor.config.ts`
and the icon generator. Nothing is duplicated in application code.

| Field | Value | Status |
| --- | --- | --- |
| App name | `NS Class 7 Study` | provisional |
| Bundle / application ID | `com.class7study.ns` | **provisional** |
| `webDir` | `dist` | verified against the Vite build |

> **Confirm the application ID before production signing.** Once an Android
> package name or iOS bundle identifier is published it cannot be changed
> without shipping a different app. The current value deliberately contains no
> reference to the Nova Scotia government, RMV or Access Nova Scotia, so it
> cannot be read as implying official affiliation.

### Versioning

There is one authoritative version — `package.json` `version` — and two
separate concepts that must not be conflated:

- **App version** — the native binary version. Android reads `package.json` at
  build time; iOS is written into `project.pbxproj` by `pnpm native:version`,
  which `pnpm native:sync` runs. `versionCode` / `CFBundleVersion` are derived
  as `major*10000 + minor*100 + patch` so they stay monotonic.
- **Content version** — a digest of the question bank, shown to learners on the
  Sources page. It changes when the *content* changes, on a completely
  different schedule from app releases. Do not tie them together.

---

## Web

Unchanged.

```bash
pnpm dev          # http://localhost:5173
pnpm build        # production build into dist/
pnpm preview      # serve the production build
```

The PWA keeps everything it had: service worker, precaching, offline operation,
installability and the "refresh to update" banner. Adding Capacitor did not
gate any of that — `e2e/native-readiness.spec.ts` asserts the worker still
registers and the manifest still serves.

---

## Android

### Prerequisites

Run `pnpm native:doctor` — it checks each of these and tells you what is
missing.

| Requirement | Version | Why |
| --- | --- | --- |
| **JDK** | **21 (LTS)** | The project uses Gradle 8.14.3 / AGP 8.13.0. Gradle 8.14 parses class files up to Java 24; **JDK 25 fails** with `Unsupported class file major version 69`. JDK 21 is what Android Studio ships and what AGP 8.x targets. |
| Android Studio | current | Installs the SDK, emulator and platform tools |
| Android SDK Platform | **36** | `compileSdk` and `targetSdk` are 36 |
| Min SDK | 24 | Android 7.0 and up |
| Gradle | 8.14.3 | via the checked-in wrapper — no separate install |

Set `ANDROID_HOME` (or open `android/` in Android Studio once, which writes
`android/local.properties`).

### Build and run

```bash
pnpm native:doctor        # what is missing, if anything
pnpm native:sync          # build -> stamp -> version -> cap sync
pnpm native:open:android  # open in Android Studio
pnpm native:android       # sync then run on device/emulator
```

A debug APK produced by Android Studio or `./gradlew :app:assembleDebug` lands
at:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

**No release keystore has been created**, and none should be until the bundle
ID is confirmed. Signing is a release-phase task.

### Android specifics applied here

- `android:allowBackup="false"` plus `res/xml/data_extraction_rules.xml`
  exclude everything from Google Auto Backup and device-to-device transfer.
  This is a deliberate privacy decision: the app tells learners their study data
  never leaves the device, and Auto Backup silently uploading an IndexedDB copy
  to a Google account would make that untrue. Learners get an explicit backup
  instead.
- Only `android.permission.INTERNET` is requested. No location, camera,
  contacts or storage permissions.
- No `android:screenOrientation` — orientation is not forced.
- `FileProvider` is already configured, which is what lets the backup file
  reach the share sheet.

---

## iOS

**Status: the iOS project is prepared, not verified.** This repository is
developed on Windows, so no iOS binary has been built or run. Everything below
is the remaining work, all of which requires macOS.

What is already done: `ios/` is generated, the bundle ID and display name are
set from `app.identity.json`, app icon and splash assets are generated into
`Assets.xcassets`, versions are synced from `package.json`, orientation is
unrestricted, and the six plugins are registered via Swift Package Manager
(Capacitor 8 uses SPM, so there is no CocoaPods step).

### On a Mac

```bash
pnpm install
pnpm native:sync             # build -> stamp -> version -> cap sync
pnpm native:open:ios         # opens ios/App/App.xcworkspace in Xcode
```

Then in Xcode:

1. Select the **App** target, then **Signing & Capabilities**.
2. Set **Team** to your Apple Developer account and let Xcode manage signing.
3. Confirm **Bundle Identifier** is the final production value — see the
   warning above; `com.class7study.ns` is provisional.
4. Choose a simulator or a connected device and press **Run**.
5. Work through `docs/NATIVE_SMOKE_TEST.md` on a device with a notch or Dynamic
   Island — safe-area behaviour cannot be verified in a browser.
6. To distribute: **Product > Archive**, then **Distribute App**.

Things that genuinely need a device rather than a simulator: the share sheet
for backup export, the software keyboard on the Profile name field, and
Automatic appearance following the system setting.

---

## Persistence

**Unchanged from the web.** IndexedDB with a synchronous `localStorage` mirror,
under the existing versioned learner envelope (`ns-class7:learner:v1`). Both are
first-class WebView APIs on Android and iOS, so there was no reason to
introduce Capacitor Preferences or SQLite, and no reason to create a web/native
storage split.

| Situation | Behaviour |
| --- | --- |
| Answer a question, background the app, resume | Progress retained |
| Force-quit and relaunch | Progress retained — every answer is persisted as it happens, not on exit |
| Install an app update (A to B) | **Progress retained.** Both platforms preserve the app's data container across updates; the storage keys and schema are unchanged, and the envelope carries a schema version with migrations if it ever needs to change |
| Uninstall the app | **Progress is deleted, permanently.** There is no cloud copy and no recovery. This is documented in the app's own Privacy section |
| Clear app storage in system settings | Same as uninstall |

Appearance is stored separately under `ns-class7:appearance`, because it is a
device preference rather than learning data — restoring a backup onto another
device does not change that device's theme.

---

## Offline

Everything needed to study is inside the app: questions, explanations, sign
artwork (221 official Schedule crops plus the SVG-drawn set), the sign
catalogue, Sign Match data, achievement artwork, source metadata, the
self-hosted Google Sans font files and the free-tier interface icons. There is
no CDN for content, no remote font and no runtime API.

**One exception, and it is decorative.** Twelve interface icons are Font Awesome
Pro. Pro artwork is licensed per seat and cannot be committed to a public
repository, so those glyphs load from a hosted Kit at runtime — the app's only
external dependency. On a phone with no signal they simply do not appear; every
one of them sits beside a text label, so nothing becomes unusable or ambiguous.
See [THIRD_PARTY_NOTICES.md §4.2](../THIRD_PARTY_NOTICES.md).

This matters more in a native build than on the web, because a packaged app is
expected to work on a plane. It does — the study experience is complete offline.
Do not describe the native app as having no network dependency at all.

Three gates enforce this rather than asserting it:

- `pnpm native:offline:check` inspects the production build for external hosts,
  `fetch`/XHR/WebSocket calls to remote URLs, remote `<script>` / `<link>` tags,
  remote CSS `@import`, missing fonts, missing sign images and missing icons. It
  permits the two Font Awesome Kit hosts by name and nothing else.
- `e2e/native-readiness.spec.ts` walks the full learner journey in a browser and
  fails if any request other than the Kit leaves the origin.
- `e2e/font-awesome-kit.spec.ts` blocks `*.fontawesome.com` outright and walks
  the journey again, so "the icons are optional" is a tested claim.

The only other external URLs in the bundle are official source citation links,
which a learner deliberately taps to leave the app.

---

## PWA versus native

| | Web / PWA | Native |
| --- | --- | --- |
| Service worker | Registered; precaches the app | **Not registered** |
| "Refresh to update" banner | Shown when a new worker waits | **Never shown** |
| "Works offline now" notice | Shown once after first cache | **Never shown** |
| How updates arrive | New worker, learner refreshes | App Store / Play Store |
| Assets | Fetched then cached | Bundled in the binary |

Both suppressions funnel through `shouldRegisterServiceWorker()` and
`shouldShowWebInstallUi()` in `src/native/platform.ts`, and are covered by
`tests/native-platform.test.ts` and `tests/native-shell.test.tsx`.

A service worker in a native build would cache a second copy of files that are
already local, and would offer a "refresh to update" affordance that cannot
deliver an update — a promise the app cannot keep.

---

## Backup and restore

**The format is identical on every platform.** A backup made in the browser
restores on a phone and vice versa. There is no `nativeBackupFormatV1`. Only
delivery differs, because `<a download>` does nothing inside a WebView:

| | Export | Restore |
| --- | --- | --- |
| Web | `<a download>` browser download | `<input type="file">` |
| Native | Written to app cache, then the **system share sheet** (Files, Drive, email) | `<input type="file">` — opens the platform file picker |

Cancelling the share sheet is treated as a cancellation, not an error.

---

## Appearance and status bar

The three options — **Automatic**, **Light**, **Dark** — work unchanged. There
is no second native setting.

Automatic resolves through `prefers-color-scheme`, the same signal the
stylesheet uses, which both WebViews report from the system setting. Using one
source means the status bar and the page can never disagree.

| Resolved theme | Status-bar content | Android bar colour |
| --- | --- | --- |
| Light | Dark icons and text | `#ffffff` (app surface) |
| Dark | Light icons and text | `#191d23` (app surface) |

The colour is the app's own surface, not a platform accent, so the bar reads as
part of the app. On iOS the bar draws over the app surface, so only the style is
set. The bar repaints when the learner changes the setting and when the system
flips light/dark under Automatic.

**Startup flash** is handled by an inline, synchronous script in `index.html`
that applies the saved theme before first paint. Without it a dark-mode learner
sees a white flash on every launch, which in a native shell reads as the app
breaking.

---

## Safe areas and viewport

`index.html` already sets `viewport-fit=cover`. The layout uses
`env(safe-area-inset-*)` through two custom properties:

```css
--safe-top: env(safe-area-inset-top, 0px);
--safe-bottom: env(safe-area-inset-bottom, 0px);
--shell-space: calc(var(--nav-height) + var(--safe-top) + var(--safe-bottom));
```

- The bottom navigation adds `--safe-bottom` to its height and padding, so it
  clears the iOS home indicator and Android gesture bar. No fixed 34px anywhere.
- Viewport-first screens size against `--shell-space` rather than `100vh`, and
  use `dvh` with a `vh` fallback.
- Status bar is configured with `overlaysWebView: false`, so on Android the
  WebView starts below the bar rather than under it.

---

## External links

On native, a global click listener intercepts `http(s)` anchors and opens them
in the system browser via `@capacitor/browser`. Without it, tapping an official
source link would navigate the app's own WebView to a government PDF with no
address bar and no reliable way back.

Internal hash routes are explicitly excluded and always stay in-app. A listener
was chosen over editing each link site because citations are rendered from data
in several places, and a future one would otherwise silently trap the learner.

---

## Privacy

- Learner state is **local only** — IndexedDB and localStorage on the device.
- **No backend.** The app makes no API calls.
- **No accounts**, no sign-in, no email address.
- **No analytics, telemetry, advertising or third-party SDKs.** No Firebase, no
  Sentry, no Google Analytics.
- Android Auto Backup and device-to-device transfer are **disabled**, so not
  even the platform copies study data off the device.
- The only permission requested on Android is `INTERNET`.
- Official source links open government websites, which have their own privacy
  policies. Nothing about the learner is passed to them.
- Uninstalling deletes local data. There is **no cloud recovery** and the app
  does not imply otherwise.

The learner-facing version of this is the **Privacy** section on the Sources
page, which is suitable as the basis for a store privacy declaration.

The independence disclaimer — *"Independent study tool. Not affiliated with or
endorsed by the Government of Nova Scotia"* — appears on the Sources page and in
the app's footer disclaimer. It is deliberately not plastered across study
screens.

---

## Build workflow

| Script | What it does |
| --- | --- |
| `pnpm native:doctor` | Reports whether this machine can build, and what is missing |
| `pnpm native:sync` | `build` -> `stamp` -> `version` -> `cap sync` |
| `pnpm native:guard` | Fails if `dist/` is stale relative to the source tree |
| `pnpm native:offline:check` | Fails if the build needs the network to study |
| `pnpm native:verify` | `guard` + `offline:check` |
| `pnpm native:assets` | Regenerates native icons and splash screens |
| `pnpm native:version` | Writes `package.json` version into the iOS project |
| `pnpm native:open:android` / `native:open:ios` | Open the native IDE |
| `pnpm native:android` / `native:ios` | Sync then run |
| `pnpm native:live -- android` | Development live reload (see below) |

### Stale-build guard

`cap sync` copies whatever is in `dist/` with no idea whether it matches the
current source. On the web a stale deploy is one refresh from being fixed; in a
store binary it is a release. So `native:sync` builds first and stamps `dist/`
with a SHA-256 digest of every build input (`src/`, `data/`, `public/`,
`index.html`, `vite.config.ts`, `app.identity.json`, the lockfile and the app
version). `pnpm native:guard` recomputes it and refuses to continue if it moved.

Note that running `pnpm build` or `pnpm test:e2e` on their own clears the stamp,
because Vite empties `dist/`. That is intended: the guard should fail closed.

### Live reload (development only)

```bash
pnpm dev --host                  # terminal 1
pnpm native:live -- android      # terminal 2
```

This sets `CAP_SERVER_URL`, which is the **only** way `server.url` gets into
`capacitor.config.ts`. A release build cannot inherit a developer's laptop
address, because nothing else sets that variable. Run `pnpm native:sync`
afterwards to restore bundled assets.

Release builds never load from a remote server — bundled assets are what makes
offline study work.

---

## Assets

| Asset | Status |
| --- | --- |
| App icon master (1024x1024) | **Ready.** `assets/icon.png`, opaque corner-to-corner as iOS requires |
| Android adaptive icon | **Ready.** `assets/icon-foreground.png` + `icon-background.png`, mark inside the 66% safe zone |
| Splash (light and dark) | **Ready.** `assets/splash.png`, `assets/splash-dark.png`, 2732x2732 |
| Generated platform sets | **Ready.** 148 Android, 14 iOS, via `pnpm native:assets` |
| PWA icons | Unchanged, `public/icons/` |

All of it is generated by `pnpm icons:generate` from the same vector primitives
as the existing approved brand mark — a teal octagon with a white numeral 7 on
the deep navy surface. Nothing is upscaled from a favicon, and no new icon was
designed for this work.

The splash is the mark on a plain brand surface: no text, no screenshot, no
government marks. `launchAutoHide: false` and `SplashScreen.hide()` is called
the moment React mounts, so it covers WebView start-up and nothing more.

**Remaining art TODO:** none that block a build. Before store submission a
designer may want to revisit the mark at very small sizes (the numeral 7 is
thin at 48px), but the current asset set is complete and correct.

---

## Release prerequisites

Not part of this phase, listed so nothing is forgotten:

- [ ] Confirm the final bundle / application ID
- [ ] Confirm the final app name
- [ ] Android release keystore, created and stored securely
- [ ] iOS signing certificate and provisioning profile
- [ ] Store listings: description, keywords, category
- [ ] Screenshots for each required device size
- [ ] Privacy declaration — base it on the Privacy section on the Sources page
- [ ] Age rating questionnaire
- [ ] Support URL and privacy-policy URL (both must be publicly reachable)
- [ ] Final pass of `docs/NATIVE_SMOKE_TEST.md` on real Android and iOS hardware
