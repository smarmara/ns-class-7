import { useState } from 'react';
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
import { appVersion, contentVersion } from '@/version';
import { Banner, Card, PageHead } from '@/ui/components';

export function Sources() {
  const resetAll = useProgress((s) => s.resetAll);
  const abandonMock = useMockExam((s) => s.abandon);
  const [confirmReset, setConfirmReset] = useState(false);

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
          The practice questions, explanations, study text, interface and road-sign artwork in this
          app are original work. Official Nova Scotia material is used as a factual research layer
          and is cited, not republished. The sign drawings are built from the shapes, colours and
          legends specified in the Traffic Signs Regulations rather than reproduced from Crown
          illustrations. No government logos or branding are used.
        </p>
      </Card>

      <Card className="section-gap" title="Your data">
        <p className="small">
          Everything you do here stays on this device. There is no account, no server and nothing is
          sent anywhere.
        </p>
        {!confirmReset ? (
          <button type="button" className="btn btn-secondary" onClick={() => setConfirmReset(true)}>
            Reset all progress
          </button>
        ) : (
          <div>
            <p className="small" style={{ marginBottom: 12 }}>
              This permanently deletes your study progress, history, saved questions and any mock
              test in progress. There is no undo.
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
