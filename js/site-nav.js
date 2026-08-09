/* ============================================================
   Shared navigation behaviour — loaded on every page.

   The per-page inline script still owns the mobile menu's open/close toggle
   (there are three slightly different copies of it). This file only adds what
   was missing everywhere: a keyboard path into the Research dropdown, honest
   ARIA state, and a backdrop + scroll lock for the mobile menu. It observes the
   menu's class instead of adding a second click handler, so it works with all
   three inline variants without touching them.
   ============================================================ */
(function () {
    'use strict';

    /* ── Research dropdown ───────────────────────────────────────────────
       CSS reveals the menu on :focus-within; this keeps aria-expanded truthful
       and gives Escape somewhere to go. */
    document.querySelectorAll('.dropdown-container').forEach(function (dc) {
        var trigger = dc.querySelector('[aria-haspopup]');
        var menu    = dc.querySelector('.dropdown-menu');
        if (!trigger || !menu) return;

        /* `is-open` mirrors :focus-within as a plain class. :focus-within alone
           already reveals the menu, but a class is what the state actually is,
           survives browsers that suppress focus styling, and is testable. */
        function expose(open) {
            trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
            dc.classList.toggle('is-open', open);
            if (open) dc.classList.remove('is-dismissed');
        }

        dc.addEventListener('mouseenter', function () { expose(true); });
        dc.addEventListener('mouseleave', function () { expose(false); });
        dc.addEventListener('focusin',    function () { expose(true); });
        dc.addEventListener('focusout',   function () {
            // focusout fires before the next element takes focus.
            window.setTimeout(function () {
                if (!dc.contains(document.activeElement)) expose(false);
            }, 0);
        });
        dc.addEventListener('keydown', function (e) {
            if (e.key !== 'Escape') return;
            dc.classList.add('is-dismissed');
            trigger.setAttribute('aria-expanded', 'false');
            trigger.focus();
        });
    });

    /* ── Header: expanded ⇄ compact ───────────────────────────────────
       All the geometry lives in CSS; this only decides which state we are in.
       Two thresholds rather than one: a single 50px trip point made the bar
       chatter whenever a scroll gesture ended near it. rAF-throttled and
       passive so the listener never blocks the scroll itself. */
    var header = document.getElementById('header');
    if (header) {
        var COMPACT_AT = 72, EXPAND_AT = 24;
        var isCompact = false, queued = false;

        var syncHeader = function () {
            queued = false;
            var y = window.scrollY || document.documentElement.scrollTop || 0;
            if (!isCompact && y > COMPACT_AT) {
                isCompact = true;
                header.classList.add('is-compact');
            } else if (isCompact && y < EXPAND_AT) {
                isCompact = false;
                header.classList.remove('is-compact');
            }
        };

        window.addEventListener('scroll', function () {
            if (queued) return;
            queued = true;
            window.requestAnimationFrame(syncHeader);
        }, { passive: true });

        syncHeader();   // a reload part-way down the page starts compact
    }

    /* ── Mobile menu ─────────────────────────────────────────────────── */
    var btn  = document.getElementById('mobile-menu-btn');
    var menu = document.getElementById('mobile-menu');
    if (!btn || !menu) return;

    var backdrop = document.createElement('div');
    backdrop.className = 'mobile-menu-backdrop';
    backdrop.hidden = true;
    backdrop.addEventListener('click', function () { menu.classList.add('hidden'); });
    document.body.appendChild(backdrop);

    function sync() {
        var open = !menu.classList.contains('hidden');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        backdrop.hidden = !open;
        document.documentElement.classList.toggle('nav-open', open);
    }

    new MutationObserver(sync).observe(menu, {
        attributes: true, attributeFilter: ['class']
    });
    sync();

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !menu.classList.contains('hidden')) {
            menu.classList.add('hidden');
            btn.focus();
        }
    });
})();
