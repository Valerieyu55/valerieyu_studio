/**
 * Valerie Yu Studio — 手繪筆記本線條 (sketch.js)
 * 在標題底下、年段標籤周圍、區塊旁邊加上手繪 SVG 線條，
 * 捲到畫面裡時一筆一筆畫出來（使用者若關閉動畫，就直接顯示畫好的線）。
 */
(function () {
    'use strict';
    const NS = 'http://www.w3.org/2000/svg';
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const UNDERLINES = [
        'M2 7 C18 1 30 11 46 5 S74 10 88 4 S110 9 118 5',
        'M2 6 C16 10 30 2 44 7 S70 3 86 8 S108 4 118 6',
        'M2 5 C20 9 34 3 50 6 S80 10 96 5 S112 3 118 7'
    ];
    const CIRCLE = 'M62 6 C98 2 118 18 114 36 C110 54 78 60 48 58 C18 56 2 42 7 26 C12 10 42 4 72 6 C82 7 88 9 92 11';
    const DOODLES = {
        teaching: ['M6 10 C14 6 20 9 26 13 C32 9 38 6 46 10 V40 C38 36 32 39 26 43 C20 39 14 36 6 40 Z', 'M26 13 V43'],
        counseling: ['M26 4 A22 22 0 1 1 25.9 4', 'M26 12 L31 26 L26 40 L21 26 Z'],
        tools: ['M8 20 H44 V42 H8 Z', 'M18 20 V13 H34 V20', 'M8 29 H44'],
        star: ['M26 6 L31 19 L45 20 L34 29 L38 43 L26 35 L14 43 L18 29 L7 20 L21 19 Z'],
        spark: ['M26 4 V48 M4 26 H48 M11 11 L41 41 M41 11 L11 41'],
        arrow: ['M6 40 C14 18 30 10 46 12', 'M36 6 L46 12 L38 21'],
        pi: ['M8 14 H44', 'M18 14 C18 28 16 38 10 44', 'M34 14 V38 C34 44 40 45 44 41']
    };

    function svg(viewBox, cls) {
        const s = document.createElementNS(NS, 'svg');
        s.setAttribute('viewBox', viewBox);
        s.setAttribute('preserveAspectRatio', 'none');
        s.setAttribute('aria-hidden', 'true');
        s.setAttribute('class', 'sk-doodle ' + (cls || ''));
        return s;
    }
    function path(d, cls, delay, dur) {
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', d);
        p.setAttribute('pathLength', '1');
        p.setAttribute('class', 'sk-ink sk-draw ' + (cls || ''));
        if (delay) p.style.setProperty('--sk-d', delay + 's');
        if (dur) p.style.setProperty('--sk-t', dur + 's');
        return p;
    }

    // 1. 標題底下的手繪線
    let n = 0;
    document.querySelectorAll('.section-title span, .zone-title, .grade-group-title, .about-heading, .mo-intro h1, .sk-mark').forEach(el => {
        if (el.querySelector(':scope > .sk-underline')) return;
        const isMark = el.classList.contains('sk-mark');
        el.classList.add('sk-underlined');
        const s = svg('0 0 120 12', 'sk-underline');
        s.appendChild(path(UNDERLINES[n++ % UNDERLINES.length], isMark ? 'sk-marker' : 'sk-gold', isMark ? 0.3 : 0.1, 0.9));
        el.appendChild(s);
    });

    // 2. 年段大標籤：手繪圈圈
    document.querySelectorAll('.grade-pill.lg').forEach((el, i) => {
        el.classList.add('sk-circled');
        const s = svg('0 0 120 64', 'sk-circle');
        s.appendChild(path(CIRCLE, i % 2 ? 'sk-gold' : '', 0.25, 1.1));
        el.appendChild(s);
    });

    // 3. 分區旁的小塗鴉
    document.querySelectorAll('.zone-head').forEach(head => {
        const zone = (head.closest('.zone') || {}).dataset ? head.closest('.zone').dataset.zone : '';
        const set = [DOODLES[zone] || DOODLES.star, DOODLES.spark, DOODLES.arrow];
        head.style.position = 'relative';
        const wrap = document.createElement('span');
        wrap.className = 'sk-head-doodles';
        wrap.setAttribute('aria-hidden', 'true');
        set.forEach((ds, i) => {
            const s = svg('0 0 52 52', 'sk-mini');
            s.removeAttribute('preserveAspectRatio');
            ds.forEach((d, j) => s.appendChild(path(d, i === 1 ? 'sk-gold sk-thin' : (i === 2 ? 'sk-thin' : ''), 0.2 + i * 0.35 + j * 0.15, 0.7)));
            wrap.appendChild(s);
        });
        head.appendChild(wrap);
    });

    // 4. 頁面邊緣零星塗鴉（大螢幕才顯示）
    const margins = document.querySelectorAll('[data-sk-margin]');
    margins.forEach((el, i) => {
        const kind = el.dataset.skMargin || 'star';
        const s = svg('0 0 52 52', 'sk-margin');
        s.removeAttribute('preserveAspectRatio');
        (DOODLES[kind] || DOODLES.star).forEach((d, j) => s.appendChild(path(d, i % 2 ? 'sk-gold' : '', 0.1 + j * 0.2, 0.8)));
        el.appendChild(s);
    });

    // 5. 進入畫面才畫：只對目前在畫面外的線條加 .sk-wait
    if (reduce || !('IntersectionObserver' in window)) return;
    const targets = new Set();
    document.querySelectorAll('.sk-doodle').forEach(s => targets.add(s));
    const io = new IntersectionObserver(entries => {
        entries.forEach(en => {
            if (en.isIntersecting) {
                requestAnimationFrame(() => en.target.classList.remove('sk-wait'));
                io.unobserve(en.target);
            }
        });
    }, { rootMargin: '0px 0px -8% 0px' });
    const vh = window.innerHeight;
    targets.forEach(t => {
        const r = t.getBoundingClientRect();
        t.classList.add('sk-wait');
        // 讓瀏覽器先畫出「未畫」狀態，再開始動畫
        if (r.top < vh && r.bottom > 0) {
            requestAnimationFrame(() => requestAnimationFrame(() => t.classList.remove('sk-wait')));
        } else {
            io.observe(t);
        }
    });
    // 篩選或展開後新出現的線條，保險起見全部畫好
    document.addEventListener('click', () => setTimeout(() => {
        document.querySelectorAll('.sk-wait').forEach(t => {
            const r = t.getBoundingClientRect();
            if (r.width === 0 && r.height === 0) t.classList.remove('sk-wait');
        });
    }, 50));
})();
