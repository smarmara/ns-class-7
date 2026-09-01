/**
 * HTML rendering for the developer sign-visual QA gallery.
 *
 * Kept apart from the generator CLI so the markup can be exercised by tests
 * without writing files: the review workflow depends on the name, designation
 * and approval control all being present on every card, and that is worth
 * asserting directly.
 */

import { countVisuals, type GalleryVisual } from './sign-visuals';

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}

/** Gallery-relative copy of an asset, so the report opens without a server. */
function galleryAssetPath(browserPath: string): string {
  const relative = browserPath.startsWith('/') ? browserPath.slice(1) : browserPath;
  return `./assets/${relative}`;
}

function renderArtwork(visual: GalleryVisual): string {
  if (visual.artworkType === 'concept-svg' && visual.svgMarkup) {
    return visual.svgMarkup;
  }
  if (visual.assetPath) {
    return `<img src="${escapeHtml(galleryAssetPath(visual.assetPath))}" alt="${escapeHtml(
      visual.visualDescription || visual.displayName,
    )}" loading="lazy" draggable="false">`;
  }
  return '<div class="art-missing">no artwork</div>';
}

/**
 * The approval control for a card.
 *
 * One deliberate click is the whole interaction: the button *is* the
 * confirmation, so there is no dialog. Only this button approves — clicking
 * the artwork, the name or the card body does nothing, which keeps a scroll
 * through the grid from locking anything in by accident.
 */
function renderApprovalControl(visual: GalleryVisual): string {
  if (visual.approvalStatus === 'approved') {
    return `
          <div class="approval" data-approval-slot>
            <span class="approved-mark">✓ Approved</span>
            <button type="button" class="undo-btn" data-action="revoke">Undo</button>
          </div>`;
  }
  if (visual.approvalStatus === 'broken') {
    return `
          <div class="approval" data-approval-slot>
            <span class="blocked-note">Artwork unreadable — cannot approve</span>
          </div>`;
  }
  if (!visual.nameResolved) {
    return `
          <div class="approval" data-approval-slot>
            <span class="blocked-note">Name unresolved — cannot approve</span>
          </div>`;
  }
  const label = visual.approvalStatus === 'changed' ? 'Approve Updated Visual' : 'Approve Visual';
  return `
          <div class="approval" data-approval-slot>
            <button type="button" class="approve-btn" data-action="approve">${label}</button>
          </div>`;
}

function renderCard(visual: GalleryVisual): string {
  const searchText = [
    visual.displayName,
    visual.appId,
    visual.designation ?? '',
    visual.variant ?? '',
    visual.name,
    visual.assetFilename ?? '',
  ]
    .join(' ')
    .toLowerCase();

  return `
      <article class="card" tabindex="0"
        data-app-id="${escapeHtml(visual.appId)}"
        data-search="${escapeHtml(searchText)}"
        data-active="${visual.isActive}"
        data-approval="${visual.approvalStatus}"
        data-name-resolved="${visual.nameResolved}"
        data-source-review="${visual.isSourceReview}">
        <div class="card-image">${renderArtwork(visual)}</div>
        <div class="card-content">
          <h2 class="card-name${visual.nameResolved ? '' : ' card-name-unresolved'}">${escapeHtml(
            visual.displayName,
          )}</h2>
          <dl class="card-meta">
            ${
              visual.designation
                ? `<div><dt>Designation</dt><dd>${escapeHtml(visual.designation)}</dd></div>`
                : ''
            }
            ${
              visual.variant
                ? `<div><dt>Variant</dt><dd>${escapeHtml(visual.variant)}</dd></div>`
                : ''
            }
            <div><dt>App ID</dt><dd>${escapeHtml(visual.appId)}</dd></div>
            ${
              visual.assetFilename
                ? `<div><dt>File</dt><dd>${escapeHtml(visual.assetFilename)}</dd></div>`
                : '<div><dt>File</dt><dd>rendered SVG</dd></div>'
            }
            <div><dt>Provenance</dt><dd>${escapeHtml(visual.provenance)}</dd></div>
            <div><dt>Usage</dt><dd>${
              visual.isActive ? `${visual.questionIds.length} question(s)` : 'unused library visual'
            }</dd></div>
          </dl>
          <div class="badges">
            <span class="badge badge-status" data-status-badge>${visual.approvalStatus.toUpperCase()}</span>
            ${visual.isSourceReview ? '<span class="badge badge-source-review">⚠ SOURCE REVIEW</span>' : ''}
            ${visual.issues
              .filter((issue) => issue !== 'NAME REVIEW REQUIRED')
              .map((issue) => `<span class="badge badge-issue">${escapeHtml(issue)}</span>`)
              .join('')}
            ${
              visual.nameResolved
                ? ''
                : '<span class="badge badge-issue">NAME REVIEW REQUIRED</span>'
            }
          </div>
          ${renderApprovalControl(visual)}
          <p class="card-error" data-error hidden></p>
        </div>
      </article>`;
}

export function generateGalleryHtml(visuals: GalleryVisual[]): string {
  const counts = countVisuals(visuals);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign Visual QA Gallery</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #f4f5f7; color: #16181d; padding: 2rem 1.5rem 4rem; }
    .wrap { max-width: 1400px; margin: 0 auto; }
    h1 { font-size: 1.4rem; margin-bottom: 0.35rem; }
    .lede { color: #555; font-size: 0.9rem; margin-bottom: 1.5rem; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem; }
    .stat-card { background: #fff; padding: 0.75rem 1rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .stat-label { font-size: 0.75rem; color: #666; text-transform: uppercase; letter-spacing: 0.04em; }
    .stat-value { font-size: 1.5rem; font-weight: 600; }
    .controls { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.5rem; position: sticky; top: 0; background: #f4f5f7; padding: 0.75rem 0; z-index: 5; }
    .search-box { flex: 1 1 260px; padding: 0.55rem 0.9rem; border: 1px solid #ccd; border-radius: 6px; font-size: 0.95rem; }
    .filter-btn { padding: 0.5rem 0.85rem; border: 1px solid #ccd; background: #fff; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
    .filter-btn.active { background: #0b5fd0; color: #fff; border-color: #0b5fd0; }
    .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 1.25rem; }
    .card { background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; flex-direction: column; }
    .card:focus-visible { outline: 3px solid #0b5fd0; outline-offset: 2px; }
    .card-image { height: 190px; display: flex; align-items: center; justify-content: center; background: #fbfbfc; border-bottom: 1px solid #eee; padding: 0.85rem; }
    .card-image img, .card-image svg { max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; }
    .art-missing { color: #b00; font-size: 0.85rem; }
    .card-content { padding: 0.9rem 1rem 1rem; display: flex; flex-direction: column; gap: 0.6rem; flex: 1; }
    .card-name { font-size: 1.02rem; line-height: 1.3; font-weight: 650; }
    .card-name-unresolved { color: #8a6100; font-style: italic; font-weight: 600; }
    .card-meta { font-size: 0.8rem; color: #555; display: grid; gap: 0.1rem; }
    .card-meta div { display: flex; gap: 0.4rem; }
    .card-meta dt { color: #888; min-width: 6.2em; }
    .card-meta dd { font-variant-numeric: tabular-nums; }
    .badges { display: flex; flex-wrap: wrap; gap: 0.3rem; }
    .badge { padding: 0.2rem 0.45rem; border-radius: 4px; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.02em; }
    .badge-status { background: #eceef2; color: #444; }
    .card[data-approval="approved"] .badge-status { background: #d8f0dd; color: #165127; }
    .card[data-approval="pending"] .badge-status { background: #fdf1cf; color: #7a5800; }
    .card[data-approval="changed"] .badge-status { background: #fadbd8; color: #7a1c14; }
    .card[data-approval="broken"] .badge-status { background: #fadbd8; color: #7a1c14; }
    .badge-issue { background: #fadbd8; color: #7a1c14; }
    .badge-source-review { background: #fdf1cf; color: #7a5800; }
    .approval { margin-top: auto; display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
    .approve-btn { padding: 0.5rem 0.95rem; background: #157a35; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 0.88rem; font-weight: 600; }
    .approve-btn:hover:not(:disabled) { background: #11632b; }
    .approve-btn:disabled { background: #8aa892; cursor: progress; }
    .approved-mark { color: #165127; font-weight: 700; font-size: 0.9rem; }
    .undo-btn { background: none; border: none; color: #666; text-decoration: underline; cursor: pointer; font-size: 0.8rem; padding: 0.2rem; }
    .undo-btn:hover:not(:disabled) { color: #16181d; }
    .undo-btn:disabled { color: #aaa; cursor: progress; }
    .blocked-note { font-size: 0.8rem; color: #7a1c14; }
    .card-error { color: #a2231a; font-size: 0.78rem; }
    .hidden { display: none !important; }
    .empty { color: #666; padding: 2rem 0; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Sign Visual QA Gallery</h1>
    <p class="lede">Developer-only. Compare the artwork with its name and designation, then approve each visual individually. Approval locks the exact artwork, mapping and canonical name — if any of those change the visual returns for re-review.</p>

    <div class="stats">
      <div class="stat-card"><div class="stat-label">Total</div><div class="stat-value" data-count="total">${counts.total}</div></div>
      <div class="stat-card"><div class="stat-label">Active</div><div class="stat-value" data-count="active">${counts.active}</div></div>
      <div class="stat-card"><div class="stat-label">Unused</div><div class="stat-value" data-count="unused">${counts.unused}</div></div>
      <div class="stat-card"><div class="stat-label">Approved</div><div class="stat-value" data-count="approved">${counts.approved}</div></div>
      <div class="stat-card"><div class="stat-label">Pending</div><div class="stat-value" data-count="pending">${counts.pending}</div></div>
      <div class="stat-card"><div class="stat-label">Changed</div><div class="stat-value" data-count="changed">${counts.changed}</div></div>
      <div class="stat-card"><div class="stat-label">Broken</div><div class="stat-value" data-count="broken">${counts.broken}</div></div>
      <div class="stat-card"><div class="stat-label">Source Review</div><div class="stat-value" data-count="sourceReview">${counts.sourceReview}</div></div>
      <div class="stat-card"><div class="stat-label">Unresolved Names</div><div class="stat-value" data-count="unresolvedNames">${counts.unresolvedNames}</div></div>
    </div>

    <div class="controls">
      <input type="search" class="search-box" id="search" placeholder="Search by name, designation, app id or filename…">
      <button type="button" class="filter-btn active" data-filter="all">All</button>
      <button type="button" class="filter-btn" data-filter="active">Active</button>
      <button type="button" class="filter-btn" data-filter="unused">Unused</button>
      <button type="button" class="filter-btn" data-filter="approved">Approved</button>
      <button type="button" class="filter-btn" data-filter="pending">Pending</button>
      <button type="button" class="filter-btn" data-filter="changed">Changed</button>
      <button type="button" class="filter-btn" data-filter="broken">Broken</button>
      <button type="button" class="filter-btn" data-filter="source-review">Source Review</button>
      <button type="button" class="filter-btn" data-filter="name-review">Name Review</button>
    </div>

    <div class="gallery" id="gallery">${visuals.map(renderCard).join('')}</div>
    <p class="empty hidden" id="empty">Nothing matches this search and filter.</p>
  </div>

  <script>
  (function () {
    var search = document.getElementById('search');
    var gallery = document.getElementById('gallery');
    var empty = document.getElementById('empty');
    var filterButtons = Array.prototype.slice.call(document.querySelectorAll('.filter-btn'));
    var cards = Array.prototype.slice.call(gallery.querySelectorAll('.card'));

    function activeFilter() {
      var active = document.querySelector('.filter-btn.active');
      return active ? active.dataset.filter : 'all';
    }

    function applyFilters() {
      var query = search.value.trim().toLowerCase();
      var filter = activeFilter();
      var shown = 0;
      cards.forEach(function (card) {
        var matchesSearch = !query || card.dataset.search.indexOf(query) !== -1;
        var matchesFilter = true;
        if (filter === 'active') matchesFilter = card.dataset.active === 'true';
        else if (filter === 'unused') matchesFilter = card.dataset.active === 'false';
        else if (filter === 'source-review') matchesFilter = card.dataset.sourceReview === 'true';
        else if (filter === 'name-review') matchesFilter = card.dataset.nameResolved === 'false';
        else if (filter !== 'all') matchesFilter = card.dataset.approval === filter;
        var visible = matchesSearch && matchesFilter;
        card.classList.toggle('hidden', !visible);
        if (visible) shown++;
      });
      empty.classList.toggle('hidden', shown > 0);
    }

    search.addEventListener('input', applyFilters);
    filterButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        filterButtons.forEach(function (other) { other.classList.remove('active'); });
        button.classList.add('active');
        applyFilters();
      });
    });

    // Counts are derived from the cards themselves, so they stay correct after
    // an approve or an undo without regenerating or reloading the page.
    function refreshCounts() {
      var totals = { approved: 0, pending: 0, changed: 0, broken: 0 };
      cards.forEach(function (card) {
        var status = card.dataset.approval;
        if (totals[status] !== undefined) totals[status]++;
      });
      Object.keys(totals).forEach(function (key) {
        var node = document.querySelector('[data-count="' + key + '"]');
        if (node) node.textContent = String(totals[key]);
      });
    }

    function setError(card, message) {
      var node = card.querySelector('[data-error]');
      if (!node) return;
      node.textContent = message || '';
      node.hidden = !message;
    }

    function approvedMarkup() {
      return '<span class="approved-mark">✓ Approved</span>' +
        '<button type="button" class="undo-btn" data-action="revoke">Undo</button>';
    }

    function pendingMarkup(status) {
      var label = status === 'changed' ? 'Approve Updated Visual' : 'Approve Visual';
      return '<button type="button" class="approve-btn" data-action="approve">' + label + '</button>';
    }

    // When a card leaves the current view — approving from the Pending filter —
    // the grid repacks and everything below shifts up a row. Pin the first
    // still-visible card that is not the one being changed, and put it back
    // where it was, so the reviewer keeps their place instead of being thrown
    // up the page mid-pass.
    function keepingScrollPlace(changedCard, mutate) {
      var anchor = null;
      for (var i = 0; i < cards.length; i++) {
        var candidate = cards[i];
        if (candidate === changedCard || candidate.classList.contains('hidden')) continue;
        var top = candidate.getBoundingClientRect().top;
        if (top >= 0) { anchor = { card: candidate, top: top }; break; }
      }
      mutate();
      if (anchor && !anchor.card.classList.contains('hidden')) {
        var shift = anchor.card.getBoundingClientRect().top - anchor.top;
        if (shift) window.scrollBy(0, shift);
      }
    }

    // The card is only repainted once the repository write has succeeded, so an
    // "Approved" mark on screen always means an approval on disk.
    function setState(card, status) {
      card.dataset.approval = status;
      var badge = card.querySelector('[data-status-badge]');
      if (badge) badge.textContent = status.toUpperCase();
      var slot = card.querySelector('[data-approval-slot]');
      if (slot) slot.innerHTML = status === 'approved' ? approvedMarkup() : pendingMarkup(status);
      refreshCounts();
      // Re-run the filters so an approved card leaves the Pending view. The
      // search box and the active filter are untouched.
      keepingScrollPlace(card, applyFilters);
    }

    async function send(endpoint, appId) {
      var response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId: appId }),
      });
      var payload = null;
      try { payload = await response.json(); } catch (err) { payload = null; }
      if (!response.ok) {
        throw new Error((payload && payload.error) || 'Review server returned ' + response.status);
      }
      return payload;
    }

    async function run(card, button, endpoint, busyLabel) {
      var appId = card.dataset.appId;
      setError(card, '');
      button.disabled = true;
      var original = button.textContent;
      button.textContent = busyLabel;
      try {
        var result = await send(endpoint, appId);
        setState(card, result && result.status ? result.status : 'pending');
      } catch (err) {
        // Persistence failed: the card stays exactly as it was and can be retried.
        button.disabled = false;
        button.textContent = original;
        setError(card, err && err.message === 'Failed to fetch'
          ? 'Review server not running. Start it with: pnpm signs:gallery:review'
          : (err && err.message) || 'Could not save. Try again.');
      }
    }

    gallery.addEventListener('click', function (event) {
      var button = event.target.closest('[data-action]');
      if (!button) return;
      var card = button.closest('.card');
      if (!card) return;
      if (button.dataset.action === 'approve') run(card, button, '/api/approve', 'Approving…');
      else run(card, button, '/api/revoke', 'Undoing…');
    });

    // Keyboard shortcut, deliberately narrow: it only fires for the card that
    // currently has keyboard focus, never while merely scrolling the grid.
    gallery.addEventListener('keydown', function (event) {
      if (event.key !== 'a' && event.key !== 'A') return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      var card = document.activeElement;
      if (!card || !card.classList || !card.classList.contains('card')) return;
      var button = card.querySelector('[data-action="approve"]');
      if (!button || button.disabled) return;
      event.preventDefault();
      run(card, button, '/api/approve', 'Approving…');
    });

    applyFilters();
    refreshCounts();
  })();
  </script>
</body>
</html>
`;
}
