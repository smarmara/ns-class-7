import { isNativeApp } from './platform';

/**
 * Saving a learner backup.
 *
 * The backup FORMAT is identical on both platforms — the same JSON envelope
 * produced by `buildBackupJson`, so a backup made on the web restores on a
 * phone and vice versa. Only the delivery differs, because the two platforms
 * mean different things by "save a file":
 *
 *   web    an `<a download>` click, which is what a browser is for.
 *   native an `<a download>` is a no-op or a silent failure in a WKWebView /
 *          Android WebView, so the file is written to app storage and handed
 *          to the system share sheet, letting the learner put it in Files,
 *          Drive, email or anywhere else.
 *
 * Restore is unchanged on both: `<input type="file">` opens the platform file
 * picker in both WebViews.
 */

export type BackupSaveResult =
  | { ok: true; via: 'download' }
  | { ok: true; via: 'share' }
  | { ok: false; reason: 'cancelled' }
  | { ok: false; reason: 'failed' };

/** Browser download. Unchanged from the app's original behaviour. */
function downloadInBrowser(filename: string, json: string): BackupSaveResult {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return { ok: true, via: 'download' };
}

/** Write to app storage, then offer the system share sheet. */
async function shareFromNative(filename: string, json: string): Promise<BackupSaveResult> {
  try {
    const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([
      import('@capacitor/filesystem'),
      import('@capacitor/share'),
    ]);

    // Cache, not Documents: this is a hand-off file. Once the learner has put
    // it somewhere they chose, leaving a second copy inside the app would be
    // clutter they cannot see or clear.
    const written = await Filesystem.writeFile({
      path: filename,
      data: json,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });

    await Share.share({
      title: 'NS Class 7 progress backup',
      // No `text`: some targets append it to the file, and a backup must stay
      // byte-identical to be restorable.
      files: [written.uri],
    });

    return { ok: true, via: 'share' };
  } catch (error) {
    // Dismissing the share sheet rejects, and that is not an error the learner
    // needs to see as a failure.
    const message = error instanceof Error ? error.message : String(error);
    if (/cancel/i.test(message)) return { ok: false, reason: 'cancelled' };
    return { ok: false, reason: 'failed' };
  }
}

export async function saveBackupFile(
  filename: string,
  json: string,
): Promise<BackupSaveResult> {
  if (isNativeApp()) return shareFromNative(filename, json);
  try {
    return downloadInBrowser(filename, json);
  } catch {
    return { ok: false, reason: 'failed' };
  }
}
