import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  activeQuestions,
  allQuestions,
  contentLastVerified,
  examConfig,
  legalStatus,
  legalStatusCounts,
  sourceManifest,
  sourcesInUse,
} from '@/content';
import { useProgress } from '@/store/useProgress';
import { useMockExam } from '@/store/useMockExam';
import { useEngagement } from '@/store/useEngagement';
import {
  buildBackupJson,
  discardPreservedCorrupt,
  hasPreservedCorrupt,
  parseBackup,
  restoreBackup,
  type PersistedLearnerState,
} from '@/store/learnerStorage';
import { appVersion, contentVersion } from '@/version';
import { isNativeApp, saveBackupFile } from '@/native';
import { Banner, Card, PageHead } from '@/ui/components';

function backupErrorText(reason: string): string {
  if (reason === 'unsupported-schema') {
    return 'This backup was made by a newer version of the app and cannot be read yet.';
  }
  return "This doesn't appear to be a valid NS Class 7 progress backup.";
}

export function Sources() {
  const resetAll = useProgress((s) => s.resetAll);
  const abandonMock = useMockExam((s) => s.abandon);
  const resetEngagement = useEngagement((s) => s.resetAll);
  const [confirmReset, setConfirmReset] = useState(false);
  const [restorePending, setRestorePending] = useState<PersistedLearnerState | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showCorrupt, setShowCorrupt] = useState(() => hasPreservedCorrupt());
  const fileInputRef = useRef<HTMLInputElement>(null);

  /*
   * The backup itself is identical on every platform — same envelope, same
   * schema — so a file made in the browser restores on a phone and the other
   * way round. Only the delivery differs: a browser downloads, a native app
   * hands the file to the system share sheet, because `<a download>` does
   * nothing inside a WebView.
   */
  const downloadBackup = async () => {
    setNotice(null);
    const progress = useProgress.getState().progress;
    const engagement = useEngagement.getState().engagement;
    const json = buildBackupJson(progress, engagement);
    const filename = `ns-class7-progress-${new Date().toISOString().slice(0, 10)}.json`;

    const result = await saveBackupFile(filename, json);
    if (result.ok) {
      setNotice(result.via === 'share' ? 'Backup ready to save or share.' : 'Backup downloaded.');
    } else if (result.reason === 'failed') {
      setNotice('Could not save the backup. Please try again.');
    }
    // 'cancelled' is the learner closing the share sheet — not a failure to report.
  };

  const pickRestoreFile = () => {
    setRestoreError(null);
    fileInputRef.current?.click();
  };

  const onRestoreFile = async (file: File | undefined) => {
    setRestoreError(null);
    if (!file) return;
    let text: string;
    try {
      text = await file.text();
    } catch {
      setRestoreError("This doesn't appear to be a valid NS Class 7 progress backup.");
      return;
    }
    const parsed = parseBackup(text);
    if (!parsed.ok) {
      setRestoreError(backupErrorText(parsed.reason));
      return;
    }
    setRestorePending(parsed.state);
  };

  const confirmRestore = async () => {
    if (!restorePending) return;
    const result = await restoreBackup(JSON.stringify(restorePending));
    if (!result.ok) {
      setRestoreError(backupErrorText(result.reason));
      setRestorePending(null);
      return;
    }
    useProgress.getState().install(result.state.progress);
    useEngagement.getState().install(result.state.engagement);
    abandonMock();
    void discardPreservedCorrupt();
    setShowCorrupt(false);
    setNotice('Progress restored from your backup.');
    setRestorePending(null);
  };

  const used = sourcesInUse();
  const counts = legalStatusCounts();
  const tsa = legalStatus.lawVersions.find((v) => v.id === 'tsa-2025');

  return (
    <>
      <PageHead title="Sources and about">
        What this study aid is based on, and what it is not
      </PageHead>

      <Banner tone="warn" icon="⚠️">
        <p>
          <strong>This is an independent, unofficial study aid.</strong> It is not affiliated with,
          endorsed by, or connected to the Government of Nova Scotia, Access Nova Scotia, or the
          Registry of Motor Vehicles.
        </p>
        <p>
          The questions here are original practice questions written from official sources. They
          are not the questions used on the real examination, and no one outside the Registry has
          access to those.
        </p>
      </Banner>

      <Card className="section-gap" title="Content status">
        <dl className="definition-list">
          <dt>Content last verified</dt>
          <dd>
            {new Date(contentLastVerified()).toLocaleDateString('en-CA', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}{' '}
            — the oldest verification date among the sources this bank relies on
          </dd>
          <dt>App version</dt>
          <dd>{appVersion}</dd>
          <dt>Content version</dt>
          <dd>{contentVersion}</dd>
          <dt>Questions available to you</dt>
          <dd>
            {activeQuestions.length} active of {allQuestions.length} in the bank
          </dd>
          <dt>By legal status</dt>
          <dd>
            {Object.entries(counts)
              .map(([status, n]) => `${n} ${status.replace(/_/g, ' ')}`)
              .join(' · ')}
          </dd>
          <dt>Law version in force</dt>
          <dd>
            {legalStatus.lawVersions.find((v) => v.id === legalStatus.activeLawVersion)?.title ??
              legalStatus.activeLawVersion}
          </dd>
        </dl>
      </Card>

      <Card className="section-gap" title="The Traffic Safety Act transition">
        <p className="small">
          Nova Scotia has enacted a Traffic Safety Act that will eventually replace the Motor
          Vehicle Act. Royal Assent is not the same thing as coming into force.
        </p>
        <dl className="definition-list">
          <dt>Status as last checked</dt>
          <dd>
            {tsa ? (tsa.inForce ? 'In force' : 'Not proclaimed in force') : 'Unknown'}
            {tsa?.evidence.observedAt ? ` (checked ${tsa.evidence.observedAt})` : ''}
          </dd>
          <dt>Evidence</dt>
          <dd>{tsa?.evidence.observation}</dd>
          <dt>What this app does about it</dt>
          <dd>
            Every question is written against the Motor Vehicle Act. Nothing is taught as current
            law until the Proclamations of Nova Scotia Statutes page shows the relevant provisions
            actually in force and a maintainer has reviewed the change.
          </dd>
        </dl>
      </Card>

      <Card className="section-gap" title="Official sources behind the questions">
        <p className="small muted">
          Listed most authoritative first. Where sources conflict, currently effective legislation
          and regulations outrank current Registry guidance and handbook amendments, which in turn
          outrank the older wording printed in the handbook chapters.
        </p>
        <ul className="tile-list">
          {used.map((source) => (
            <li key={source.id}>
              <a
                className="tile"
                href={source.documentUrl ?? source.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="tile-body">
                  <span className="tile-title">{source.title}</span>
                  <span className="tile-sub">
                    {source.authority}
                    {source.citation ? ` · ${source.citation}` : ''} · verified {source.verifiedAt}
                  </span>
                </span>
                <span className="tile-chevron" aria-hidden="true">
                  ↗
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="section-gap" title="Sources monitored but not taught">
        <p className="small muted">
          These are watched for changes so that a new rule is noticed early. Nothing on them is
          served as a question until it is in force and reviewed.
        </p>
        <ul className="small" style={{ paddingLeft: 20, margin: 0 }}>
          {sourceManifest.sources
            .filter((s) => !used.some((u) => u.id === s.id))
            .map((s) => (
              <li key={s.id} style={{ marginBottom: 6 }}>
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.title}
                </a>
              </li>
            ))}
        </ul>
      </Card>

      <Card className="section-gap" title="The official test">
        <dl className="definition-list">
          {examConfig.sections.map((s) => (
            <div key={s.id}>
              <dt>{s.name}</dt>
              <dd>
                {s.questionCount} multiple-choice questions, {s.passingCorrect} correct to pass,{' '}
                {s.timeLimitMinutes} minutes
              </dd>
            </div>
          ))}
          <dt>Retakes</dt>
          <dd>{examConfig.retakeRules.note}</dd>
          <dt>Fee</dt>
          <dd>${examConfig.administration.feeCad.toFixed(2)}</dd>
        </dl>
        <p className="small muted section-gap" style={{ marginBottom: 0 }}>
          Always confirm the current test format, fees and requirements on the{' '}
          <a
            href="https://www.novascotia.ca/take-driver-knowledge-test-learners-licence-class-7"
            target="_blank"
            rel="noopener noreferrer"
          >
            official Class 7 knowledge test page
          </a>
          .
        </p>
      </Card>

      <Card className="section-gap" title="Copyright and original material">
        <p className="small">
          The practice questions, explanations, study text, interface and original road-sign artwork
          in this app are original work. Official Nova Scotia material is used as a factual research
          layer and is cited, not republished, except that a subset of signs is displayed using the
          government's own published Schedule images, which are reproduced as-is for the purpose of
          accurate sign recognition. The remaining sign drawings are built from the shapes, colours
          and legends specified in the Traffic Signs Regulations rather than reproduced from Crown
          illustrations. No government logos or branding are used.
        </p>
      </Card>

      <Card className="section-gap" title="Privacy">
        <p className="small">
          Everything you do in this app stays on this device. There is no account to create, no
          server to sign in to, and no copy of your answers, progress or profile is ever sent
          anywhere. We could not look at your study history if we wanted to — it never leaves your
          phone or browser.
        </p>
        <ul className="small" style={{ paddingLeft: 20, margin: '0 0 10px' }}>
          <li>No accounts, no sign-in, no email address.</li>
          <li>No analytics, tracking, advertising or telemetry of any kind.</li>
          <li>
            No backend service. Every question, explanation, sign image and font is stored in the
            app, so studying works with the network switched off.
          </li>
          <li>
            Your display name and appearance choice are stored on this device only, alongside your
            study progress.
          </li>
          <li>
            One thing does load from elsewhere: the interface icons come from Font Awesome
            (fontawesome.com) when the app opens. That request contains nothing about you or your
            studying — it fetches the icons and nothing more. If it is blocked or you are offline,
            the icons are simply missing and everything else works as normal.
          </li>
          <li>
            Official source links open the Government of Nova Scotia and Nova Scotia Legislature
            websites, which have their own privacy policies. Nothing about you is passed to them.
          </li>
        </ul>
        <p className="small muted" style={{ marginBottom: 0 }}>
          Because nothing is stored off the device, there is no cloud copy to recover from. If you
          want your progress to survive a reinstall or a new phone, back it up below.
        </p>
      </Card>

      <Card className="section-gap" title="Your progress">
        <p className="small">
          Your study progress is saved automatically on this device. No account is required, and
          your study history is not sent to us.{' '}
          {isNativeApp()
            ? 'Uninstalling the app, or clearing its storage in system settings, deletes it permanently — there is no cloud copy to restore from. Installing an update from the store keeps it.'
            : "Clearing this site's data, or using private browsing, may remove it."}{' '}
          You can create a backup if you want to keep a portable copy.
        </p>
        <p className="small muted" role="status">
          Saved on this device
        </p>

        {notice && (
          <p className="small" role="status">
            {notice}
          </p>
        )}
        {showCorrupt && (
          <p className="small">
            A previously saved copy could not be read and was set aside. You can restore a backup
            below, or reset to start fresh.
          </p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(e) => void onRestoreFile(e.target.files?.[0])}
          aria-label="Choose a progress backup file"
        />

        {!restorePending && !restoreError && (
          <div className="btn-row">
            <button type="button" className="btn" onClick={() => void downloadBackup()}>
              Back up progress
            </button>
            <button type="button" className="btn btn-secondary" onClick={pickRestoreFile}>
              Restore progress
            </button>
          </div>
        )}

        {restoreError && (
          <div>
            <p className="small" style={{ marginBottom: 12 }}>
              {restoreError}
            </p>
            <div className="btn-row">
              <button type="button" className="btn btn-secondary" onClick={pickRestoreFile}>
                Choose another file
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setRestoreError(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {restorePending && (
          <div>
            <p className="small" style={{ marginBottom: 12 }}>
              Restoring this backup will replace the progress currently saved on this device.
              There is no undo.
            </p>
            <div className="btn-row">
              <button type="button" className="btn btn-secondary" onClick={() => setRestorePending(null)}>
                Cancel
              </button>
              <button type="button" className="btn" onClick={() => void confirmRestore()}>
                Restore this backup
              </button>
            </div>
          </div>
        )}

        <hr className="section-gap" />

        {!confirmReset ? (
          <button type="button" className="btn btn-secondary" onClick={() => setConfirmReset(true)}>
            Reset all progress
          </button>
        ) : (
          <div>
            <p className="small" style={{ marginBottom: 12 }}>
              This permanently deletes your study progress, history, saved questions, XP, streak,
              any practice exam in progress and the backup copy kept on this device. There is no undo.
            </p>
            <div className="btn-row">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmReset(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  void resetAll();
                  abandonMock();
                  void resetEngagement();
                  setShowCorrupt(false);
                  setNotice(null);
                  setConfirmReset(false);
                }}
              >
                Erase everything
              </button>
            </div>
          </div>
        )}
      </Card>

      <p className="disclaimer">
        <Link to="/">Back to dashboard</Link>
      </p>
    </>
  );
}
