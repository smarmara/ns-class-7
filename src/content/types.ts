/**
 * The content model for the question bank.
 *
 * Everything here is data-layer only: no React, no browser APIs. The same
 * types are consumed by the app, by `pnpm content:validate` and by the tests,
 * so that a rule change is a data edit rather than a component edit.
 */

/** How a question relates to the law as it currently stands. */
export type LegalStatus =
  /** Backed by law in force today. Only these may be served to a learner. */
  | 'current'
  /** Backed by law that has been enacted but is not yet in force. Never served. */
  | 'future'
  /** Was correct under law that has since been replaced. Kept for the audit trail. */
  | 'superseded'
  /** A watched source changed underneath it. Withheld until a maintainer reviews. */
  | 'under_review';

export type QuestionType = 'rules' | 'sign';

export type Difficulty = 'easy' | 'medium' | 'hard';

/**
 * A pointer back to the official material that establishes the rule.
 * `sourceId` must exist in data/sources/source-manifest.json.
 */
export interface SourceReference {
  sourceId: string;
  /** Statute/regulation section, e.g. "s.124A(2)". */
  section?: string;
  /** Handbook chapter, e.g. "Chapter 2". */
  chapter?: string;
  /** Printed page number in the handbook, e.g. "p. 61". */
  page?: string;
  /** Deep link, when the source exposes one. */
  url?: string;
  /** What this source establishes, in the maintainer's words. */
  note?: string;
}

/** Curriculum topics. Used for the coverage matrix and weak-area tracking. */
export const RULES_TOPICS = [
  'traffic-signals',
  'right-of-way',
  'intersections',
  'pedestrians-crosswalks',
  'school-zones-and-buses',
  'emergency-vehicles',
  'transit-buses',
  'speed-limits',
  'following-and-stopping',
  'lane-use',
  'turning',
  'passing',
  'parking-and-stopping',
  'roundabouts',
  'highways-and-merging',
  'adverse-conditions',
  'impairment',
  'graduated-licensing',
  'vehicle-and-driver-safety',
  'sharing-the-road',
  'collisions-and-emergencies',
] as const;

export const SIGNS_TOPICS = [
  'signs-regulatory',
  'signs-warning',
  'signs-school',
  'signs-work-zone',
  'signs-guide',
  'signs-lane-use',
  'signs-railway',
  'signs-pedestrian-and-cyclist',
  'pavement-markings',
] as const;

export type RulesTopic = (typeof RULES_TOPICS)[number];
export type SignsTopic = (typeof SIGNS_TOPICS)[number];
export type Topic = RulesTopic | SignsTopic;

export const ALL_TOPICS: readonly Topic[] = [...RULES_TOPICS, ...SIGNS_TOPICS];

/** Human-readable topic labels for the UI. */
export const TOPIC_LABELS: Record<Topic, string> = {
  'traffic-signals': 'Traffic signals',
  'right-of-way': 'Right of way',
  intersections: 'Intersections',
  'pedestrians-crosswalks': 'Pedestrians and crosswalks',
  'school-zones-and-buses': 'School zones and school buses',
  'emergency-vehicles': 'Emergency vehicles',
  'transit-buses': 'Transit buses',
  'speed-limits': 'Speed limits',
  'following-and-stopping': 'Following and stopping',
  'lane-use': 'Lane use',
  turning: 'Turning',
  passing: 'Passing',
  'parking-and-stopping': 'Parking and stopping',
  roundabouts: 'Roundabouts and rotaries',
  'highways-and-merging': 'Highways and merging',
  'adverse-conditions': 'Adverse conditions',
  impairment: 'Impairment',
  'graduated-licensing': 'Graduated licensing',
  'vehicle-and-driver-safety': 'Vehicle and driver safety',
  'sharing-the-road': 'Sharing the road',
  'collisions-and-emergencies': 'Collisions and emergencies',
  'signs-regulatory': 'Regulatory signs',
  'signs-warning': 'Warning signs',
  'signs-school': 'School signs',
  'signs-work-zone': 'Work zone signs',
  'signs-guide': 'Guide and information signs',
  'signs-lane-use': 'Lane use signs',
  'signs-railway': 'Railway signs',
  'signs-pedestrian-and-cyclist': 'Pedestrian and cyclist signs',
  'pavement-markings': 'Pavement markings',
};

export interface Question {
  /** Stable, human-meaningful id, e.g. "rules-right-of-way-004". */
  id: string;
  type: QuestionType;
  topic: Topic;
  subtopic?: string;

  question: string;
  choices: string[];
  /** Index into `choices` as authored. Randomisation never mutates this. */
  correctChoice: number;

  /** Why the correct answer is correct. Original wording. */
  explanation: string;
  /**
   * Optional per-choice notes on why a tempting wrong answer is wrong.
   * Indices line up with `choices`; the correct index may be null/empty.
   */
  incorrectChoiceExplanations?: (string | null)[];

  difficulty: Difficulty;
  tags: string[];

  /** At least one required for any question served to a learner. */
  sourceRefs: SourceReference[];

  legalStatus: LegalStatus;

  /** ISO date the maintainer last checked this against the sources. */
  verifiedAt: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  /** Which law version this is written against; see exam-config/legal-status.json. */
  lawVersion?: string;

  /**
   * For sign questions: the sign artwork to display with the stem.
   * Must be a key in the sign registry.
   */
  signId?: string;
  /**
   * For sign questions whose choices are themselves signs (identify-the-sign
   * drills), the sign key for each choice.
   */
  choiceSignIds?: string[];

  /** Set when a source this question depends on has changed and needs review. */
  reviewReason?: string;
}

export interface ExamSectionConfig {
  id: string;
  name: string;
  shortName: string;
  questionType: QuestionType;
  description: string;
  questionCount: number;
  passingCorrect: number;
  timeLimitMinutes: number;
  format: string;
}

export interface ExamConfig {
  id: string;
  title: string;
  jurisdiction: string;
  derivedFrom: string[];
  verifiedAt: string;
  note: string;
  sectionsPassIndependently: boolean;
  sectionsRetakenIndependently: boolean;
  aggregateScoreDecidesOutcome: boolean;
  sections: ExamSectionConfig[];
  retakeRules: {
    onlyRetakeFailedSections: boolean;
    onlineWaitingPeriod: string;
    inPersonWaitingPeriod: string;
    note: string;
  };
  eligibility: {
    minimumAge: number;
    parentalConsentRequiredUnderAge: number;
    otherRequirements: string[];
  };
  administration: {
    channels: string[];
    onlineRequirements: string[];
    languages: string[];
    interpreterAvailable: boolean;
    verbalTestAvailable: boolean;
    feeCad: number;
    resourcesAllowed: boolean;
  };
  preparation: { officialInstruction: string; handbookUrl: string };
  afterPassing: string[];
}

export interface ManifestSource {
  id: string;
  title: string;
  url: string;
  documentUrl?: string;
  type: string;
  jurisdiction: string;
  authority: string;
  precedence: number;
  status: string;
  retrievedAt: string;
  verifiedAt: string;
  effectiveFrom?: string;
  consolidatedTo?: string;
  citation?: string;
  sections?: string[];
  notes?: string;
  watchFor?: string;
  contentHash: string | null;
  previousHash: string | null;
  http: { lastModified: string | null; etag: string | null };
}

export interface SourceManifest {
  manifestVersion: number;
  description: string;
  hashAlgorithm: string;
  policy: { verificationMaxAgeDays: number; staleWarnDays: number; comment: string };
  precedenceLevels: Record<string, string>;
  sources: ManifestSource[];
}

export interface LawVersion {
  id: string;
  title: string;
  inForce: boolean;
  inForceSince: string | null;
  consolidatedTo?: string;
  evidence: { sourceId: string; observedAt?: string; observation: string };
  note: string;
}

export interface LegalStatusConfig {
  description: string;
  activeLawVersion: string;
  lastReviewedAt: string;
  reviewedBy: string;
  lawVersions: LawVersion[];
  promotionChecklist: string[];
}
