/* app.js (esp) — loads data/*.json, renders every card, feeds the map. Same helpers as wsp: tiles, sheets, tabs, drawer.
   Each widget renders independently: a missing or broken file leaves a quiet
   "coming soon" note and never blocks the rest of the page. */
window.WSP = window.WSP || {};
/* Michael, 2026-10-25: every link that leaves the site opens in a new tab (decided at click time, so links built later and the map's links follow too) */
document.addEventListener('click', (e) => { const a = e.target.closest && e.target.closest('a[href]'); if (!a) return; let u; try { u = new URL(a.getAttribute('href'), location.href); } catch (err) { return; }
  if ((u.protocol === 'http:' || u.protocol === 'https:') && u.origin !== location.origin) { a.target = '_blank'; a.rel = 'noopener'; } }, true);
  /* The hero: each city is done, now or ahead, in Madrid time. A travel day belongs to the city she lands in. */
  WSP.heroType = function () {
    const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const cities = [...document.querySelectorAll('.h2-day[data-from]')];
    cities.forEach((d, i) => { const from = d.dataset.from, next = cities[i + 1] ? cities[i + 1].dataset.from : null, to = d.dataset.to;
      const st = ymd < from ? 'ahead' : (next ? ymd < next : ymd <= to) ? 'today' : 'past';
      d.dataset.state = st; const t = d.querySelector('.h2-state'); if (t) t.textContent = st === 'past' ? ', done' : st === 'today' ? ', now' : ''; });
  };
  const heroGo = () => { WSP.heroType();
    document.addEventListener('click', (e) => { const a = e.target.closest('[data-hero-go]'); if (!a) return; const ch = a.dataset.heroGo;
      if (WSP.shell && WSP.shell.go) { e.preventDefault(); history.replaceState(null, '', '#' + (a.dataset.heroCard || 'scene-' + ch));
        const first = (a.dataset.heroCard && document.getElementById(a.dataset.heroCard)) || document.querySelector(`#scene-${ch} > section.w:not([hidden]):not([data-nocollapse])`); if (first && WSP.shell.setOpen) WSP.shell.setOpen(first, true);
        setTimeout(() => {
          if (a.dataset.heroCard && first) {   /* a named card: land on the card itself */
            WSP.shell.go(ch, { scroll: false }); const nav = document.querySelector('.site-nav'); const top = first.getBoundingClientRect().top + scrollY - (nav ? nav.offsetHeight : 0) - 12;
            scrollTo({ top: Math.max(0, top), behavior: WSP.motion() }); const t = first.querySelector('.w-toggle'); if (t) t.focus({ preventScroll: true });
          } else { WSP.shell.go(ch); const t = document.querySelector(`#scene-${ch} [data-chapter-toggle]`); if (t) t.focus({ preventScroll: true }); }
        }, 50); } }); };  /* review 5: focus follows */   /* review 2: open the first card, then land on the category head */  /* review 2: land on the first card, open */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', heroGo); else heroGo();
  setInterval(() => WSP.heroType && WSP.heroType(), 5 * 60 * 1000);
  /* review 3: arrow keys move along a tab row, as tabs should */
  document.addEventListener('keydown', (e) => { const t = e.target.closest && e.target.closest('[role=tab]'); if (!t || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    const all = [...t.parentNode.querySelectorAll('[role=tab]')]; let i = all.indexOf(t);
    i = e.key === 'Home' ? 0 : e.key === 'End' ? all.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length;
    e.preventDefault(); all[i].focus(); all[i].click(); });
  WSP.motion = () => (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth');
(function () {
  const I = WSP.icons.ui, TZ = 'Europe/Madrid';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const body = (name) => $(`[data-widget="${name}"] .body`);
  const gmaps = (loc) => loc.gmaps_url || WSP.map.gmapsFallback(loc);
  const imgSrc = (img) => img && (img.local || img.src) || '';
  const pick = (o, k) => o && (o[k + '_local'] || o[k]) || '';
  const todayISO = () => new Date().toLocaleDateString('en-CA', { timeZone: TZ });
  const nowHour = () => Number(new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: TZ }));
  const dayKey = (iso) => ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date(iso + 'T12:00:00').getDay()];
  const longDay = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  async function load(name) {
    try { const r = await fetch(`data/${name}.json`, { cache: 'no-cache' }); if (!r.ok) throw 0; return await r.json(); }
    catch (e) { return null; }
  }
  function pending(name, msg) { const b = body(name); if (b) b.innerHTML = `<div class="pending-note">${esc(msg || 'Research still coming in — check back in a bit')}</div>`; }
  /* a source can be one URL, a list, or several URLs in one string: each becomes its own small link */
  function src(url, label) { const u = [].concat(url || []).join(' ').split(/[\s;,]+/).filter(x => /^https?:\/\//.test(x)); return u.map((x, i) => ` <a class="src" href="${esc(x)}" target="_blank" rel="noopener" title="Source">${label || 'source'}${u.length > 1 ? ' ' + (i + 1) : ''}</a>`).join(''); }
  function media(img, cls = '') {
    if (!imgSrc(img)) return '';
    return `<figure class="media ${cls}"><img src="${esc(imgSrc(img))}" alt="" loading="lazy" onerror="this.closest('figure').remove()">${img.credit ? `<figcaption class="credit">${img.credit_url ? `<a href="${esc(img.credit_url)}" target="_blank" rel="noopener">${esc(img.credit)}</a>` : esc(img.credit)}</figcaption>` : ''}</figure>`;
  }
  function hoursToday(h) {
    if (!h) return ''; if (typeof h === 'string') return h;
    const k = dayKey(todayISO()); return h[k] ? `Today ${h[k]}` : '';
  }
  function links(loc, extra = '') {
    const out = [`<a class="link-pill maps" href="${esc(gmaps(loc))}" target="_blank" rel="noopener">${I.pin}Maps</a>`];
    if (loc.yelp_photos_url) out.push(`<a class="link-pill" href="${esc(loc.yelp_photos_url)}" target="_blank" rel="noopener">${I.camera}${/restaurant|street-food/.test(loc.category || '') ? 'Food photos' : 'Photos'}</a>`);
    if (loc.spotify_url) out.push(`<a class="link-pill" href="${esc(loc.spotify_url)}" target="_blank" rel="noopener">${I.spotify}Spotify</a>`);
    if (loc.reservation && loc.reservation.url) out.push(`<a class="link-pill" href="${esc(loc.reservation.url)}" target="_blank" rel="noopener">${I.ticket}Reserve</a>`);
    if (loc.website) out.push(`<a class="link-pill" href="${esc(loc.website)}" target="_blank" rel="noopener">${I.link}Site</a>`);
    if (loc.lat && loc.lng) out.push(`<button class="link-pill" data-focus="${esc(loc.id)}">${I.pin}On map</button>`);
    return `<div class="links">${out.join('')}${extra}</div>`;
  }
  function metaBits(loc) {
    const m = [];
    if (loc.price) m.push(esc(loc.price));
    if (loc.walk_from_venue_minutes != null) m.push(`${loc.walk_from_venue_minutes} min walk`);
    else if (loc.walk_from_riverside_miles != null) m.push(`${loc.walk_from_riverside_miles} mi from the Riverside`);
    else if (loc.travel_from_downtown) m.push(esc(loc.travel_from_downtown));
    if (loc.best_time) m.push(esc(loc.best_time));
    if (loc.best_window) m.push(esc(loc.best_window));
    const h = hoursToday(loc.hours_this_weekend); if (h) m.push(esc(h));
    return m.length ? `<div class="meta">${m.map(x => `<span>${x}</span>`).join('<span aria-hidden="true">·</span>')}</div>` : '';
  }
  /* A tile: the picture, the name, one line, and Read more. The rest lives in the sheet. */
  function tile(o) {
    const img = o.art ? `<span class="tile-img tile-garn" style="--c:var(--wsp-cat-${esc(o.cat || 'landmark')})">${o.art}</span>` : o.img ? `<img class="tile-img" src="${esc(o.img)}" alt="" loading="lazy" onerror="this.classList.add('is-gone')">` : `<span class="tile-img tile-cat" style="--c:var(--wsp-cat-${esc(o.cat || 'landmark')})"></span>`;
    const bare = o.bare || (!o.art && !o.img);   /* no picture: no placeholder block */
    return `<li class="tile${bare ? ' tile--bare' : ''}" ${o.attrs || ''}>${bare ? '' : img}<div class="tile-t"><h3>${esc(o.name)}</h3>${o.line ? `<p class="tile-line">${o.line}</p>` : ''}</div><button class="btn btn--sm tile-more" type="button" aria-label="Read more: ${esc(o.name)}" ${o.open}>Read more</button></li>`;
  }
  function placeRow(loc, opts = {}) {
    const cat = loc.category || 'landmark';
    const bits = []; if (loc.walk_from_venue_minutes != null) bits.push(`${loc.walk_from_venue_minutes} min walk`); else if (loc.walk_from_riverside_miles != null) bits.push(`${loc.walk_from_riverside_miles} mi`); if (loc.price) bits.push(esc(loc.price));
    const line = opts.line ? opts.line(loc) : bits.join(' · ');
    return tile({ img: imgSrc(loc.image), cat, name: loc.name, line, open: `data-sheet="${esc(loc.id)}"`, attrs: `data-id="${esc(loc.id)}"` });
  }
  /* Blocks of info that are not places (cast, mascots, bands): the same tile, the content in the sheet. */
  const modals = {}; let modalN = 0;
  function modal(html) { const id = 'm' + (++modalN); modals[id] = html; return `data-modal="${id}"`; }
  const FOLD = 6;
  function factsList(arr, limit = 6, cls = '') {
    arr = arr || []; const rows = arr.map((f, i) => `<li ${i >= limit ? 'data-folded ' : ''}><span class="n num">${i + 1}</span><span>${esc(typeof f === 'string' ? f : f.fact || f.text)}${src(typeof f === 'string' ? '' : f.source)}</span></li>`);
    const more = arr.length > limit ? `<button class="btn btn--sm fold-btn" type="button" data-fold-n="${arr.length - limit}">Show ${arr.length - limit} more</button>` : '';
    return `<ul class="facts-list places${arr.length > limit ? ' folded' : ''} ${cls}">${rows.join('')}</ul>${more}`;
  }
  function placeList(arr, opts = {}) {
    arr = arr || []; const limit = opts.limit || FOLD;
    const rows = arr.map((l, i) => placeRow(l, opts).replace('<li class="tile"', `<li ${i >= limit ? 'data-folded ' : ''}class="tile"`));
    const more = arr.length > limit ? `<button class="btn btn--sm fold-btn" type="button" data-fold-n="${arr.length - limit}">Show ${arr.length - limit} more</button>` : '';
    return `<ul class="tiles${arr.length > limit ? ' folded' : ''}">${rows.join('')}</ul>${more}`;
  }
  document.addEventListener('click', (e) => {
    const f = e.target.closest('.fold-btn'); if (!f) return;
    const ul = f.previousElementSibling; const open = ul.classList.toggle('folded');
    f.textContent = open ? `Show ${f.dataset.foldN} more` : 'Show fewer';
    if (open) ul.scrollIntoView({ block: 'nearest' });
  });

  /* ---------- Detail sheet ---------- */
  const byId = {};
  WSP.sheet = {
    openLocation(loc) {
      const sb = $('#sheet-body'); if (!sb) return;
      const rows = [];
      if (loc.address) rows.push(['Address', esc(loc.address)]);
      if (loc.hours_this_weekend) rows.push(['Hours', typeof loc.hours_this_weekend === 'string' ? esc(loc.hours_this_weekend) : ['fri', 'sat', 'sun', 'mon'].filter(k => loc.hours_this_weekend[k]).map(k => `<b>${k[0].toUpperCase() + k.slice(1)}</b> ${esc(loc.hours_this_weekend[k])}`).join('<br>')]);
      if (loc.must_order) rows.push(['Order', esc([].concat(loc.must_order).join(', '))]);
      if (loc.signature_drink) rows.push(['Drink', esc(loc.signature_drink)]);
      if (loc.vibe) rows.push(['Vibe', esc(loc.vibe)]);
      if (loc.why_special) rows.push(['Why', esc(loc.why_special)]);
      if (loc.tv_setup) rows.push(['Screens', esc(loc.tv_setup)]);
      if (loc.cost) rows.push(['Cost', esc(loc.cost)]);
      if (loc.reservation && loc.reservation.needed != null) rows.push(['Reservation', loc.reservation.needed ? 'Recommended' : 'Walk in']);
      if (loc.wsp_fan_note) rows.push(['Panic fans', esc(loc.wsp_fan_note)]);
      if (loc.why) rows.push(['Why go', esc(loc.why)]);
      if (loc.phone) rows.push(['Phone', `<a href="tel:${esc(loc.phone.replace(/[^\d+]/g, ''))}">${esc(loc.phone)}</a>`]);
      sb.innerHTML = `${media(loc.image)}<div style="display:flex;flex-direction:column;gap:10px;margin-top:12px">
        <span class="eyebrow"><span class="dot" style="display:inline-block;width:9px;height:9px;background:var(--wsp-cat-${esc(loc.category || 'landmark')});margin-right:8px;vertical-align:middle"></span>${esc((WSP.map.CATS[loc.category] || {}).label || loc.category || '')}</span>
        <h3 id="sheet-title" class="heading-sm">${esc(loc.name)}</h3>
        <p class="prose">${esc(loc.blurb || '')}</p>
        ${rows.length ? `<dl style="display:grid;grid-template-columns:auto 1fr;gap:6px 14px;font-size:var(--pds-text-caption);margin:0">${rows.map(([k, v]) => `<dt class="label" style="padding-top:2px">${k}</dt><dd style="margin:0">${v}</dd>`).join('')}</dl>` : ''}
        ${links(loc)}${loc.source ? `<p class="caption">Source: <a href="${esc(loc.source)}" target="_blank" rel="noopener">${esc(new URL(loc.source, location.href).hostname)}</a></p>` : ''}</div>`;
      WSP.sheet._show();
    },
    _show() { const sh = $('#sheet'); WSP.sheet._from = document.activeElement; sh.setAttribute('aria-modal', 'true'); sh.classList.add('open'); sh.setAttribute('aria-hidden', 'false'); $('#scrim').classList.add('open'); sh.scrollTop = 0; const m = $('main'); if (m && !sh.closest('main')) m.inert = true; ['.site-header', '.site-nav', 'footer'].forEach(q => { const x = $(q); if (x) x.inert = true; });  /* review 4: focus stays in the sheet */ const c = $('#sheet-close'); if (c) setTimeout(() => c.focus(), 30); },
    openHTML(html) {
      const sb = $('#sheet-body'); if (!sb) return; sb.innerHTML = html;
      WSP.sheet._show();
    },
    close() { const sh = $('#sheet'); if (!sh.classList.contains('open')) return; sh.classList.remove('open'); sh.setAttribute('aria-hidden', 'true'); $('#scrim').classList.remove('open'); const m = $('main'); if (m) m.inert = false; ['.site-header', '.site-nav', 'footer'].forEach(q => { const x = $(q); if (x) x.inert = false; }); if (WSP.sheet._from && WSP.sheet._from.focus) WSP.sheet._from.focus(); WSP.sheet._from = null; }
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-sheet]'); if (a) { e.preventDefault(); const l = byId[a.dataset.sheet]; if (l) WSP.sheet.openLocation(l); return; }
    const m = e.target.closest('[data-modal]'); if (m) { e.preventDefault(); if (modals[m.dataset.modal]) WSP.sheet.openHTML(modals[m.dataset.modal]); return; }
    const f = e.target.closest('[data-focus]'); if (f) { e.preventDefault(); WSP.sheet.close(); WSP.map.focus(f.dataset.focus); return; }
    if (e.target.closest('#sheet-close') || e.target.id === 'scrim') WSP.sheet.close();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') WSP.sheet.close(); });

  /* ---------- Theme toggle ---------- */
  if ($('#theme-toggle')) $('#theme-toggle').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next); try { localStorage.setItem('esp-theme', next); } catch (e) {}
  });

  /* ---------- Menu: a drawer from the left over a light scrim (Michael 2026-10-24 00:46) ---------- */
  const mega = $('#mega'), menuBtn = $('#menu-btn'), scrim = $('#mega-scrim');
  const sectionTitle = (id) => { const h = $(`#${id} > header h2`) || $(`#${id} h2`); return h ? h.textContent.trim() : id; };
  const isOpen = () => mega.classList.contains('is-open');
  function setMenu(open, focusBack) {
    mega.classList.toggle('is-open', open); if (scrim) scrim.classList.toggle('is-on', open);
    mega.inert = !open; mega.setAttribute('aria-hidden', String(!open));
    document.documentElement.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    if (open) {
      const cur = document.body.dataset.chapter || '';
      $$('.mega-cat', mega).forEach(a => { if (a.dataset.chapterLink === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
      setTimeout(() => { const f = $('.mega-cat[aria-current]', mega) || $('.mega-cat', mega); if (f) f.focus({ preventScroll: true }); }, 60);
    } else if (focusBack) menuBtn.focus({ preventScroll: true });
  }
  // the drawer and its scrim live at the top of the page's stacking order, not inside the sticky bar
  if (scrim) document.body.append(scrim); document.body.append(mega);
  mega.hidden = false; setMenu(false);
  menuBtn.addEventListener('click', () => setMenu(!isOpen(), true));
  if (scrim) scrim.addEventListener('click', () => setMenu(false, true));
  const closeBtn = $('.mega-close', mega); if (closeBtn) closeBtn.addEventListener('click', () => setMenu(false, true));
  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key === 'Escape') { setMenu(false, true); return; }
    if (e.key === 'Tab') { const f = $$('button, a', mega); const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
  });
  // a swipe toward the left closes it
  let sx = null; mega.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
  mega.addEventListener('touchend', (e) => { if (sx !== null && sx - e.changedTouches[0].clientX > 60) setMenu(false, true); sx = null; }, { passive: true });
  mega.addEventListener('click', (e) => {
    const x = e.target.closest('a.mega-xl');
    if (x) { setMenu(false); if (x.dataset.x === 'top') { e.preventDefault(); scrollTo({ top: 0, behavior: WSP.motion() }); history.replaceState(null, '', location.pathname); const h = document.querySelector('.h2-btn'); if (h) setTimeout(() => h.focus({ preventScroll: true }), 60); } return; }
    const a = e.target.closest('a.mega-cat'); if (!a) return;
    e.preventDefault(); setMenu(false);
    const ch = a.dataset.chapterLink;
    if (WSP.shell && WSP.shell.go) WSP.shell.go(ch);
    history.replaceState(null, '', '#scene-' + ch);
    setTimeout(() => { const t = document.querySelector(`#scene-${ch} [data-chapter-toggle]`) || document.querySelector(`#scene-${ch} h2`); if (t) { if (!t.matches('button, a')) t.tabIndex = -1; t.focus({ preventScroll: true }); } }, 80);  /* review 4: focus follows her to the category */
  });

  /* ---------- Shared pieces for the trip ---------- */
  const arr = (x) => Array.isArray(x) ? x : (x == null || x === '' ? [] : [x]);
  const known = (v) => v != null && v !== '' && !/^\s*(not found|unknown|n\/a|tbd)\b/i.test(String(v));
  const txt = (v) => known(v) ? esc(String(v)) : '';
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const isoDates = (v) => [...String(Array.isArray(v) ? v.join(' ') : (v || '')).matchAll(/(\d{4})-(\d{2})-(\d{2})/g)].map(m => m[0]);
  const dLabel = (iso, wd) => { const d = new Date(iso + 'T12:00:00'); return `${wd ? WD[d.getDay()] + ' ' : ''}${MON[d.getMonth()]} ${d.getDate()}`; };
  /* "2026-10-28/2026-11-01" reads as a run, a list reads as days, one date reads with its weekday */
  function when(v) {
    const ds = isoDates(v); if (!ds.length) return txt(Array.isArray(v) ? v.join(', ') : v);
    const ranged = !Array.isArray(v) && ds.length === 2 && /\d\s*(\/|to|–|—|-\s|through|until)\s*\d|\d\/\d/.test(String(v));
    if (ds.length === 1) return dLabel(ds[0], true);
    if (ranged || (Array.isArray(v) && v.length === 2 && /\//.test(v.join('')))) return `${dLabel(ds[0])} – ${dLabel(ds[1])}`;
    return ds.map((x, i) => i && x.slice(5, 7) === ds[i - 1].slice(5, 7) ? String(Number(x.slice(8))) : dLabel(x)).join(', ');
  }
  /* is it on today, and has it all gone by? (Madrid time) */
  function span(v) { const ds = isoDates(v).sort(); if (!ds.length) return null; const ranged = !Array.isArray(v) && ds.length === 2; return { first: ds[0], last: ds[ds.length - 1], all: ranged ? null : ds }; }
  const onToday = (v) => { const s = span(v), t = todayISO(); if (!s) return false; return s.all ? s.all.includes(t) : s.first <= t && t <= s.last; };
  const gone = (v) => { const s = span(v); return !!s && s.last < todayISO(); };
  const srcList = (urls) => { const u = [...new Set(arr(urls).join(' ').split(/[\s;,]+/).filter(x => /^https?:\/\//.test(x)))]; return u.length ? `<p class="caption src-list">Sources: ${u.map((x, i) => `<a href="${esc(x)}" target="_blank" rel="noopener">${esc(host(x))}</a>`).join(', ')}</p>` : ''; };
  const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return 'source'; } };
  const row = (k, v) => v ? `<p class="bm-garn"><b>${k}:</b> ${v}</p>` : '';
  const pill = (href, label, icon, cls = '') => href && /^(https?:|tel:)/.test(href) ? `<a class="link-pill ${cls}" href="${esc(href)}" target="_blank" rel="noopener">${icon}${label}</a>` : '';
  const mapsFor = (p) => p.gmaps_url || WSP.map.gmapsFallback(p);
  const onMap = (p) => typeof p.lat === 'number' && typeof p.lng === 'number' && p.id ? `<button class="link-pill" data-focus="${esc(p.id)}">${I.pin}On map</button>` : '';
  function tabs(bd, key, groups) {
    groups = groups.filter(g => g && g[2]);
    if (!groups.length) return;
    bd.innerHTML = `<div class="tabs" role="tablist">${groups.map(([id, l], i) => `<button class="tab" role="tab" id="${key}-${id}" aria-selected="${i === 0}" aria-controls="${key}p-${id}" tabindex="${i ? -1 : 0}">${esc(l)}</button>`).join('')}</div>${groups.map(([id, , html], i) => `<div role="tabpanel" id="${key}p-${id}" aria-labelledby="${key}-${id}" ${i ? 'hidden' : ''}>${html}</div>`).join('')}`;
    bd.querySelector('.tabs').addEventListener('click', (e) => { const t = e.target.closest('.tab'); if (!t) return; bd.querySelectorAll('.tab').forEach(x => { x.setAttribute('aria-selected', x === t); x.tabIndex = x === t ? 0 : -1; }); bd.querySelectorAll('[role=tabpanel]').forEach(x => x.hidden = x.id !== t.getAttribute('aria-controls')); });
  }
  /* a tile line: no asides, no year, en dashes, nothing "not found" */
  const tidy = (t) => String(t || '').replace(/\s*\([^)]*\)/g, '').replace(/,?\s*2026\b/g, '').replace(/\s+-\s+/g, ' – ').replace(/(\d)-(\d)/g, '$1–$2').split(/[.;]\s/).filter(x => !/not found/i.test(x))[0] || '';
  const roastLine = (sig) => { if (!known(sig)) return ''; const parts = String(sig).split(/[,;.(]\s*/).map(x => x.trim()).filter(Boolean); return parts.find(x => /cochinillo|suckling|lech[oó]n|cordero|lamb|roast|asado/i.test(x)) || parts[0]; };
  const tiles = (list) => list.length ? `<ul class="tiles">${list.join('')}</ul>` : '';
  const ruleList = (list, k = 'note') => { list = arr(list).filter(x => x && (typeof x === 'string' || x[k])); return list.length ? `<ul class="rules">${list.map(t => `<li class="rule"><span class="ic">${I.info}</span><span>${esc(typeof t === 'string' ? t : t[k])}${typeof t === 'string' ? '' : src(t.source)}</span></li>`).join('')}</ul>` : ''; };
  /* a dated list: the year in the margin, the fact beside it, its source after it */
  const yearList = (list, k = 'fact') => { list = arr(list).filter(x => x && x[k]); return list.length ? `<ol class="yr-list">${list.map(f => `<li><span class="yr num">${esc(f.year || '')}</span><span>${esc(f[k])}${src(f.source)}</span></li>`).join('')}</ol>` : ''; };

  /* ---------- A city's week: food, music and art, in date order ---------- */
  const CAT_TAB = [['food', 'Food'], ['music', 'Music'], ['art', 'Art']];
  function eventSheet(p, cityName) {
    const book = p.booking_url || p.url || p.website;
    return `<span class="eyebrow">${esc([(CAT_TAB.find(c => c[0] === p.category) || [, ''])[1], p.neighborhood && known(p.neighborhood) ? p.neighborhood : cityName].filter(Boolean).join(' · '))}</span>
      <h3 id="sheet-title" class="heading-sm">${esc(p.name)}</h3>
      ${known(p.why_go) ? `<p class="prose"><b class="strong">${esc(p.why_go)}</b></p>` : ''}
      ${row('When', [when(p.dates), txt(p.times)].filter(Boolean).join(' · '))}
      ${row('Where', [txt(p.venue), txt(p.address)].filter(Boolean).join(', '))}
      ${row('Price', txt(p.price))}
      ${known(p.notes) ? `<p class="caption">${esc(p.notes)}</p>` : ''}
      <div class="links">${pill(book, 'Tickets & info', I.ticket, 'maps')}${p.address || p.venue ? pill(mapsFor(Object.assign({ city: cityName }, p, { name: p.venue || p.name })), 'Maps', I.pin) : ''}${onMap(p)}</div>
      ${srcList(p.sources)}`;
  }
  function renderWeek(key, d, cityName) {
    const bd = body(key); if (!bd) return; if (!d || !arr(d.items).length) return pending(key);
    /* {start, end} reads as a run of days */
    const items = arr(d.items).filter(p => p && p.name).map(p => Object.assign(p, { city: cityName }, p.dates && !Array.isArray(p.dates) && typeof p.dates === 'object' ? { dates: `${p.dates.start}/${p.dates.end || p.dates.start}` } : {}));
    const shortTime = (t) => { t = known(t) ? String(t).split(/[;(.]\s/)[0].trim() : ''; return t.length <= 24 && !/not found/i.test(t) ? t.replace(/(\w)-(\w)/g, '$1–$2') : ''; };
    /* date order: an ISO date, else the first "Oct 30" / "Nov 1" in the words, else the end */
    const order = (p) => { const s = span(p.dates); if (s) return s.first; const m = String(p.dates || '').replace(/closed[^;.,)]*/gi, '').match(/\b(Oct|Nov)\s+(\d{1,2})\b/); return m ? `2026-${m[1] === 'Oct' ? '10' : '11'}-${m[2].padStart(2, '0')}` : '9999'; };
    const sorted = (cat) => items.filter(p => p.category === cat).map((p, i) => [p, i]).sort((a, b) => order(a[0]).localeCompare(order(b[0])) || a[1] - b[1]).map(x => x[0]);
    const t = (p) => tile({ bare: true, cat: p.category, name: p.name, line: esc([tidy(when(p.dates).replace(/&amp;/g, '&').replace(/&#39;/g, "'")), shortTime(p.times)].filter(Boolean).join(' · ')), open: modal(eventSheet(p, cityName)), attrs: `data-cat="${esc(p.category)}"${onToday(p.dates) && (span(p.dates) || {}).all ? ' data-today' : ''}${gone(p.dates) ? ' data-gone' : ''}` });
    const groups = CAT_TAB.map(([c, l]) => [c, l, tiles(sorted(c).map(t))]);
    groups.push(['notes', 'Good to know', ruleList(d.city_notes)]);
    tabs(bd, key, groups);
  }

  /* ---------- Botín ---------- */
  function renderBotin(b) {
    const bd = body('botin'); if (!bd) return; const x = b && b.botin; if (!x) return pending('botin');
    x.id = x.id || 'botin'; x.category = 'roast';
    const res = x.reservations || {};
    const spec = arr(x.specialties).filter(s => s && s.dish).map(s => `<li><span>${esc(s.dish)}${known(s.notes) ? ` <span class="muted">${esc(s.notes)}</span>` : ''}</span><span class="num">${txt(s.price)}</span></li>`).join('');
    const story = arr(x.history).filter(f => f && f.fact).map(f => `<li><span>${esc(f.fact)}${src(f.source)}</span></li>`).join('');
    const diners = arr(x.famous_diners).filter(f => f && f.name).map(f => `<li><span><b>${esc(f.name)}.</b> ${esc(f.story || '')}${src(f.source)}</span></li>`).join('');
    const book = `<div class="links">${pill(res.url, 'Reserve', I.ticket, 'maps')}${pill(x.menu_url, 'Menu', I.link)}${x.phone ? `<a class="link-pill" href="tel:${esc(String(x.phone).replace(/[^\d+]/g, ''))}">${I.clock}Call</a>` : ''}${pill(mapsFor(Object.assign({ city: 'Madrid' }, x)), 'Maps', I.pin)}${onMap(x)}</div>`;
    tabs(bd, 'bt', [
      ['table', 'The table', `${spec ? `<ul class="price-list">${spec}</ul>` : ''}
        ${row('Hours', txt(x.hours))}${row('Rooms', txt(x.rooms))}${row('Dress', txt(x.dress))}${x.email ? row('Email', `<a href="mailto:${esc(x.email)}">${esc(x.email)}</a>`) : ''}${row('Book', [txt(res.lead_time), txt(res.notes)].filter(Boolean).join(' '))}
        ${ruleList(x.tips)}${known(x.vegetarian) ? `<p class="caption"><b>Not eating pig?</b> ${esc(x.vegetarian)}</p>` : ''}${book}`],
      ['story', 'The story', `${story ? `<ul class="facts-list story-list">${story}</ul>` : ''}${diners ? `<span class="label">At the tables</span><ul class="facts-list story-list">${diners}</ul>` : ''}${srcList([].concat(x.sources || [], x.specialties_source || [], x.hours_source || [], x.tips_sources || []))}`],
    ]);
  }
  function renderCochinillo(b) {
    const bd = body('cochinillo'); if (!bd) return; const list = arr(b && b.how_its_made).filter(f => f && f.fact);
    if (!list.length) return pending('cochinillo');
    bd.innerHTML = factsList(list, 8);
  }
  function roastSheet(p) {
    return `<span class="eyebrow">${esc(p.city || '')}</span><h3 id="sheet-title" class="heading-sm">${esc(p.name)}</h3>
      ${known(p.why_go) ? `<p class="prose"><b class="strong">${esc(p.why_go)}</b></p>` : ''}
      ${row('Order', [txt(p.signature), known(p.price) ? esc(p.price) : ''].filter(Boolean).join(' · '))}${row('Hours', txt(p.hours))}${row('Address', txt(p.address))}
      ${known(p.notes) ? `<p class="caption">${esc(p.notes)}</p>` : ''}
      <div class="links">${pill(p.reservation_url, 'Reserve', I.ticket, 'maps')}${pill(p.website, 'Site', I.link)}${pill(mapsFor(p), 'Maps', I.pin)}${onMap(p)}</div>${srcList(p.sources)}`;
  }
  function renderRoasts(b) {
    const bd = body('roasts'); if (!bd) return; const sim = arr(b && b.similar).filter(p => p && p.name); if (!sim.length) return pending('roasts');
    sim.forEach(p => { p.category = 'roast'; });
    const t = (p) => tile({ bare: true, cat: 'roast', name: p.name, line: esc([p.city, roastLine(p.signature)].filter(Boolean).join(' · ')), open: modal(roastSheet(p)) });
    const seg = (b && b.segovia_trip) || {};
    const madrid = sim.filter(p => !/segovia/i.test(p.city || '')), segovia = sim.filter(p => /segovia/i.test(p.city || ''));
    tabs(bd, 'rs', [
      ['madrid', 'In Madrid', tiles(madrid.map(t))],
      ['segovia', 'Segovia', `${tiles(segovia.map(t))}${seg.train || seg.time ? `<div class="trip-box">${row('Train', txt(seg.train))}${row('Time', txt(seg.time))}${row('Fare', txt(seg.cost))}${known(seg.notes) ? `<p class="caption">${esc(seg.notes)}</p>` : ''}${srcList(seg.sources)}</div>` : ''}`],
    ]);
  }

  /* ---------- La Sagrada Família ---------- */
  function renderSagrada(s) {
    const ids = ['sagrada-history', 'sagrada-arch', 'gaudi', 'sagrada-visit', 'sagrada-mass'];
    if (!s) { ids.forEach(i => pending(i)); return; }
    const h = body('sagrada-history'); if (h) h.innerHTML = yearList(s.history) || '';
    const a = body('sagrada-arch'); if (a) { const l = arr(s.architecture).filter(x => x && x.point); a.innerHTML = l.length ? `<ul class="facts-list places">${l.map((x, i) => `<li><span class="n num">${i + 1}</span><span>${esc(x.point)}${src(x.source)}</span></li>`).join('')}</ul>` : ''; }
    const g = body('gaudi'); if (g) g.innerHTML = yearList(s.gaudi) || '';
    const v = s.visit || {}; const vb = body('sagrada-visit');
    if (vb) {
      const hrs = arr(v.hours).filter(x => x && x.date); const tk = arr(v.tickets).filter(x => x && x.name);
      const tkt = (x) => { const pr = String(x.price || ''); const m = pr.match(/^([^()]+?)\s*\((.+)\)\s*$/);
        return `<li class="tkt"><div><h3>${esc(x.name)}</h3>${known(x.includes) ? `<p>${esc(x.includes)}</p>` : ''}${m ? `<p class="tkt-more">${esc(m[2].charAt(0).toUpperCase() + m[2].slice(1))}</p>` : ''}</div><span class="num tkt-p">${esc(m ? m[1] : pr)}</span></li>`; };
      const book = (tk.find(x => x.booking_url) || {}).booking_url;
      tabs(vb, 'sv', [
        ['tickets', 'Tickets', `${tk.length ? `<ul class="tkt-list">${tk.map(tkt).join('')}</ul>` : ''}${row('Book', txt(v.booking_lead))}<div class="links">${pill(book, 'Book on the official site', I.ticket, 'maps')}${pill(mapsFor({ name: 'Basílica de la Sagrada Família', address: v.address }), 'Maps', I.pin)}${typeof v.lat === 'number' ? `<button class="link-pill" data-focus="sagrada-familia">${I.pin}On map</button>` : ''}</div>`],
        ['hours', 'Hours', hrs.length ? `<dl class="hrs hrs--wide">${hrs.map(x => `<dt>${isoDates(x.date).length ? dLabel(isoDates(x.date)[0], true) : esc(x.date)}</dt><dd>${esc(x.hours)}${src(x.source)}</dd>`).join('')}</dl>` : ''],
        ['tips', 'Before you go', `${known(v.hours_note) ? `<p class="caption">${esc(v.hours_note)}</p>` : ''}${row('Towers', txt(v.towers))}${row('Bring', txt(v.what_to_bring))}${row('At the door', txt(v.dress_security))}${row('The light', txt(v.best_light))}${srcList(v.sources)}`],
        ['near', 'Nearby', tiles(arr(s.nearby).filter(x => x && x.name).map(p => tile({ bare: true, cat: 'food', name: p.name, line: esc(String(p.why || '').split(/[.;]/)[0]), open: modal(`<span class="eyebrow">Near the basilica</span><h3 id="sheet-title" class="heading-sm">${esc(p.name)}</h3>${known(p.why) ? `<p class="prose">${esc(p.why)}</p>` : ''}${row('Address', txt(p.address))}<div class="links">${pill(mapsFor(Object.assign({ city: 'Barcelona' }, p)), 'Maps', I.pin)}</div>${srcList(p.source)}`) })))],
      ]);
    }
    const m = s.mass || {}; const mb = body('sagrada-mass');
    if (mb) {
      const sch = arr(m.schedule).filter(x => x && (x.day || x.time));
      mb.innerHTML = `${sch.length ? `<dl class="hrs hrs--wide">${sch.map(x => `<dt>${esc(x.day || '')}</dt><dd><b class="num">${esc(x.time || '')}</b>${known(x.language) ? ` · ${esc(x.language)}` : ''}${known(x.notes) ? `<br><span class="muted">${esc(x.notes)}</span>` : ''}</dd>`).join('')}</dl>` : ''}
        ${row('Tickets', txt(m.tickets_needed))}${known(m.how_to_attend) ? `<p class="prose">${esc(m.how_to_attend)}</p>` : ''}${srcList([m.source].concat(arr(m.other_sources)))}`;
    }
  }

  /* ---------- Cava ---------- */
  function cavaSheet(p, kind) {
    return `<span class="eyebrow">${esc([kind, p.town || p.city].filter(Boolean).join(' · '))}</span><h3 id="sheet-title" class="heading-sm">${esc(p.name)}</h3>
      ${known(p.tour_name) ? `<p class="bm-garn"><b>${esc(p.tour_name)}</b></p>` : ''}${known(p.why_go) ? `<p class="prose"><b class="strong">${esc(p.why_go)}</b></p>` : ''}
      ${row('Length', txt(p.duration))}${row('Price', txt(p.price))}${row('In English', txt(p.languages || p.english_times))}${row('Run by', txt(p.operator))}${row('Starts', [txt(p.start), txt(p.meeting_point)].filter(Boolean).join(', '))}${row('Includes', txt(p.includes || p.winery))}${row('Nov 1 – 5', txt(p.availability_nov_1_5 || p.availability))}${row('Glass', txt(p.price_notes))}${row('Contact', txt(p.contact))}${row('Visitor center', txt(p.visitor_center_status))}${row('Hours', txt(p.hours))}${row('Getting there', txt(p.how_to_get_there || p.getting_there))}${row('Address', txt(p.address))}
      ${known(p.notes) ? `<p class="caption">${esc(p.notes)}</p>` : ''}
      <div class="links">${pill(p.booking_url, 'Book', I.ticket, 'maps')}${pill(p.website, 'Site', I.link)}${p.address ? pill(mapsFor(p), 'Maps', I.pin) : ''}${onMap(p)}</div>${srcList([].concat(p.sources || [], p.source || []))}`;
  }
  function renderCava(c) {
    const ids = ['cava-story', 'cava-tours', 'cava-bars']; if (!c) { ids.forEach(i => pending(i)); return; }
    const st = body('cava-story'); const r = c.region || {};
    if (st) tabs(st, 'cs', [
      ['history', 'The history', factsList(arr(c.history).filter(f => f && f.fact), 10)],
      ['region', 'The region', `${known(r.summary) ? `<p class="prose">${esc(r.summary)}${src(r.summary_sources)}</p>` : ''}${arr(r.getting_there).filter(g => g && g.mode).map(g => row(esc(g.mode), [txt(g.time), txt(g.cost), txt(g.notes)].filter(Boolean).join(' · ') + src(g.source))).join('')}`],
    ]);
    const tb = body('cava-tours');
    if (tb) {
      const t = (p, kind) => { p.category = 'cava'; return tile({ bare: true, cat: 'cava', name: p.name, line: esc([p.town, known(p.price) ? String(p.price).split(/[;(]/)[0] : ''].filter(Boolean).join(' · ')), open: modal(cavaSheet(p, kind)) }); };
      tabs(tb, 'ct', [
        ['cellars', 'The cellars', (known(c.notes) ? `<p class="caption">${esc(c.notes)}</p>` : '') + tiles(arr(c.tours).filter(p => p && p.name).map(p => t(p, 'Cellar tour')))],
        ['day', 'Day tours', tiles(arr(c.day_tours).filter(p => p && p.name).map(p => t(p, 'From Barcelona')))],
      ]);
    }
    const bb = body('cava-bars');
    if (bb) {
      const gl = arr(c.glossary).filter(g => g && g.term);
      tabs(bb, 'cb', [
        ['bars', 'Cava bars', tiles(arr(c.bars).filter(p => p && p.name).map(p => { p.category = 'bar'; p.city = 'Barcelona'; return tile({ bare: true, cat: 'bar', name: p.name, line: esc(known(p.neighborhood) ? p.neighborhood : String(p.address || '').split(',')[0]), open: modal(cavaSheet(p, 'Cava bar')) }); }))],
        ['order', 'How to order', gl.length ? `<dl class="gloss">${gl.map(g => `<dt>${esc(g.term)}</dt><dd>${esc(g.meaning)}${src(g.source)}</dd>`).join('')}</dl>` : ''],
      ]);
    }
  }

  /* ---------- Every pin ---------- */
  function collect(d) {
    const out = [];
    const pin = (x, cat, city) => { if (x && typeof x.lat === 'number' && typeof x.lng === 'number' && x.name) { if (!x.id) x.id = String(x.name).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-'); out.push(Object.assign(x, { category: x.category && WSP.map.CATS[x.category] ? x.category : cat, city: x.city || city, blurb: x.blurb || x.why_go || x.why || '' })); } };
    [['madrid', 'Madrid'], ['barcelona', 'Barcelona'], ['sansebastian', 'San Sebastián']].forEach(([k, c]) => arr(d[k] && d[k].items).forEach(x => pin(x, x.category || 'landmark', c)));
    if (d.botin) { if (d.botin.botin) { d.botin.botin.id = 'botin'; pin(d.botin.botin, 'roast', 'Madrid'); } arr(d.botin.similar).forEach(x => pin(x, 'roast')); }
    if (d.sagrada) { const v = d.sagrada.visit || {}; if (typeof v.lat === 'number') pin({ id: 'sagrada-familia', name: 'Basílica de la Sagrada Família', lat: v.lat, lng: v.lng, address: v.address, why_go: 'Gaudí’s basilica, still being built.' }, 'landmark', 'Barcelona'); arr(d.sagrada.nearby).forEach(x => pin(x, 'food', 'Barcelona')); }
    if (d.cava) { arr(d.cava.tours).forEach(x => pin(x, 'cava')); arr(d.cava.day_tours).forEach(x => pin(x, 'cava')); arr(d.cava.bars).forEach(x => pin(x, 'bar', 'Barcelona')); }
    const seen = {}; return out.filter(l => { if (seen[l.id]) return false; seen[l.id] = l; return true; });
  }

  /* ---------- Boot ---------- */
  async function boot() {
    const wxP = WSP.weather.init();
    const names = ['updates', 'notes', 'welcome', 'madrid', 'barcelona', 'sansebastian', 'botin', 'sagrada', 'cava'];
    const d = Object.fromEntries(await Promise.all(names.map(async n => [n, await load(n)])));
    const locs = collect(d); locs.forEach(l => byId[l.id] = l); WSP.locations = locs;
    [[() => renderWeek('madrid-week', d.madrid, 'Madrid')], [() => renderWeek('barcelona-week', d.barcelona, 'Barcelona')], [() => renderWeek('donostia-week', d.sansebastian, 'San Sebastián')],
     [() => renderBotin(d.botin)], [() => renderCochinillo(d.botin)], [() => renderRoasts(d.botin)], [() => renderSagrada(d.sagrada)], [() => renderCava(d.cava)]]
      .forEach(([f]) => { try { f(); } catch (e) { console.warn('render', e); } });
    WSP.map.init(locs, (WSP.weather.CITY || {}).id);
    WSP.shell.init(d);
    await wxP;
  }
  boot();
})();
