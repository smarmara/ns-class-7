import { readFileSync } from 'node:fs';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  MAX_DISPLAY_NAME,
  normaliseDisplayName,
  normaliseProfile,
  profileInitials,
} from '@/engine/profile/types';
import { emptyEngagement } from '@/engine/engagement/types';
import { emptyProgress } from '@/engine/learning/types';
import { buildBackupJson, parseBackup } from '@/store/learnerStorage';
import { useProfile } from '@/store/useProfile';
import { useProgress } from '@/store/useProgress';
import { useEngagement } from '@/store/useEngagement';
import { APPEARANCE_KEY, applyAppearance, readAppearance, useAppearance } from '@/store/useAppearance';
import { ProfileCard } from '@/ui/ProfileCard';

/**
 * The local learner profile, the appearance control and the achievements
 * summary. Everything here is on-device: no account, no network.
 */

describe('display name handling', () => {
  it('trims, collapses whitespace and caps the length', () => {
    expect(normaliseDisplayName('  Alex  ')).toBe('Alex');
    expect(normaliseDisplayName('Alex   Jordan')).toBe('Alex Jordan');
    expect(normaliseDisplayName('x'.repeat(60))).toHaveLength(MAX_DISPLAY_NAME);
  });

  it('treats an empty name as no profile', () => {
    expect(normaliseDisplayName('')).toBeNull();
    expect(normaliseDisplayName('   ')).toBeNull();
  });

  it('derives initials locally, with no avatar service', () => {
    expect(profileInitials({ displayName: 'Alex' })).toBe('A');
    expect(profileInitials({ displayName: 'Alex Jordan' })).toBe('AJ');
    expect(profileInitials({ displayName: 'Alex Kim Jordan' })).toBe('AJ');
    expect(profileInitials(undefined)).toBe('');
  });

  it('rejects a malformed stored profile rather than failing a restore', () => {
    expect(normaliseProfile(undefined)).toBeUndefined();
    expect(normaliseProfile({ displayName: 42 })).toBeUndefined();
    expect(normaliseProfile({ displayName: '   ' })).toBeUndefined();
    expect(normaliseProfile({ displayName: ' Alex ' })).toEqual({ displayName: 'Alex' });
  });
});

describe('profile persistence', () => {
  it('round-trips through a backup', () => {
    const json = buildBackupJson(emptyProgress(), emptyEngagement(), undefined, {
      displayName: 'Alex',
    });
    expect(JSON.parse(json).profile).toEqual({ displayName: 'Alex' });

    const restored = parseBackup(json);
    expect(restored.ok).toBe(true);
    if (!restored.ok) return;
    expect(restored.state.profile).toEqual({ displayName: 'Alex' });
  });

  it('loads a backup written before profiles existed', () => {
    const json = buildBackupJson(emptyProgress(), emptyEngagement());
    expect(JSON.parse(json).profile).toBeUndefined();

    const restored = parseBackup(json);
    expect(restored.ok, 'an older backup must still restore').toBe(true);
    if (!restored.ok) return;
    expect(restored.state.profile).toBeUndefined();
  });
});

describe('appearance preference', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    useAppearance.setState({ appearance: 'auto' });
  });

  it('defaults to Automatic, which writes no attribute', () => {
    expect(readAppearance()).toBe('auto');
    applyAppearance('auto');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('reflects an explicit choice onto the document and stores it', () => {
    useAppearance.getState().setAppearance('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem(APPEARANCE_KEY)).toBe('dark');

    useAppearance.getState().setAppearance('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    useAppearance.getState().setAppearance('auto');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(readAppearance()).toBe('auto');
  });

  it('ignores a corrupted stored value', () => {
    localStorage.setItem(APPEARANCE_KEY, 'neon');
    expect(readAppearance()).toBe('auto');
  });
});

describe('the dark palette covers all three appearance states', () => {
  const css = readFileSync('src/styles.css', 'utf8');

  const tokensIn = (selector: string) => {
    const start = css.indexOf(selector);
    expect(start, `${selector} not found`).toBeGreaterThan(-1);
    const open = css.indexOf('{', start);
    const end = css.indexOf('\n}', open);
    return css
      .slice(open + 1, end)
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('--'))
      .sort();
  };

  it('applies automatically unless the learner chose light', () => {
    expect(css).toContain("@media (prefers-color-scheme: dark)");
    expect(css).toContain(":root:not([data-theme='light'])");
  });

  it('applies on an explicit dark choice', () => {
    expect(css).toContain(":root[data-theme='dark']");
  });

  it('keeps the two token lists identical', () => {
    // They are duplicated because CSS has no way to share a declaration block
    // between two selectors in different at-rule contexts. This is the guard.
    const auto = tokensIn(":root:not([data-theme='light'])");
    const explicit = tokensIn(":root[data-theme='dark']");
    expect(auto.length).toBeGreaterThan(40);
    expect(explicit).toEqual(auto);
  });
});

describe('the profile card', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    useAppearance.setState({ appearance: 'auto' });
    useProfile.setState({ profile: undefined, hydrated: true });
    useProgress.setState({ progress: emptyProgress(), hydrated: true });
    useEngagement.setState({ engagement: emptyEngagement(), hydrated: true });
  });

  it('invites a fresh learner to create a profile', () => {
    render(<ProfileCard />);
    expect(screen.getByText('Create your profile')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create profile' })).toBeInTheDocument();
  });

  it('creates a profile and derives the avatar', () => {
    render(<ProfileCard />);
    fireEvent.click(screen.getByRole('button', { name: 'Create profile' }));
    fireEvent.change(screen.getByLabelText('Display name'), { target: { value: 'Alex Jordan' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('Alex Jordan')).toBeInTheDocument();
    expect(document.querySelector('.profile-avatar')!.textContent).toBe('AJ');
    expect(useProfile.getState().profile).toEqual({ displayName: 'Alex Jordan' });
  });

  it('renames without needing to delete anything', () => {
    useProfile.setState({ profile: { displayName: 'Alex' }, hydrated: true });
    render(<ProfileCard />);

    fireEvent.click(screen.getByRole('button', { name: /^Edit/ }));
    fireEvent.change(screen.getByLabelText('Display name'), { target: { value: 'Sam' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('Sam')).toBeInTheDocument();
    expect(useProfile.getState().profile).toEqual({ displayName: 'Sam' });
  });

  it('offers Automatic, Light and Dark as a radio group', () => {
    render(<ProfileCard />);
    const group = screen.getByRole('radiogroup', { name: 'Appearance' });
    const options = screen.getAllByRole('radio');
    expect(options.map((o) => o.textContent)).toEqual(['Automatic', 'Light', 'Dark']);
    expect(group).toBeInTheDocument();

    // Selection is programmatically determinable, not colour-only.
    expect(options[0]).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(options[2]!);
    expect(screen.getAllByRole('radio')[2]).toHaveAttribute('aria-checked', 'true');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('shows an honest empty achievement state for a fresh learner', () => {
    render(<ProfileCard />);
    expect(screen.getByText(/None yet/)).toBeInTheDocument();
    expect(document.querySelectorAll('.profile-achievement')).toHaveLength(0);
  });

  it('never presents an unearned achievement as earned', () => {
    render(<ProfileCard />);
    // With empty progress nothing is earned, so no chip may be rendered and
    // no earned-count may be claimed.
    expect(document.querySelectorAll('.profile-achievement')).toHaveLength(0);
    expect(document.querySelector('.profile-achievements-count')).toBeNull();
    expect(screen.getByText(/None yet/)).toBeInTheDocument();
  });
});
