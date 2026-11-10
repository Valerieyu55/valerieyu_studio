/**
 * Valerie Yu Studio - 作品顯示／隱藏
 * 後台把作品設為隱藏後，這裡讀 Firebase 的 site/hidden，
 * 把對應的作品卡、選單連結藏起來，並更新首頁與關於我的作品數。
 */
(function () {
    'use strict';
    var CACHE = 'vys_hidden_projects';

    function norm(u) { return String(u || '').split('#')[0].split('?')[0].replace(/index\.html$/, '').replace(/\/+$/, '').toLowerCase(); }
    function keyOf(href, title) {
        var defs = window.VYS_DEFAULT_PROJECTS || {}, h = norm(href);
        for (var k in defs) if (defs[k].url && norm(defs[k].url) === h) return k;
        var f = window.VYS_deriveProjectKey;
        return f ? f(href || '', title || '') : '';
    }

    function apply(hidden) {
        hidden = hidden || {};
        document.querySelectorAll('.pcard').forEach(function (card) {
            var a = card.querySelector('a[href^="http"]');
            var t = card.querySelector('.pcard-title');
            var k = a ? keyOf(a.getAttribute('href'), t ? t.textContent : '') : '';
            card.classList.toggle('vys-off', !!(k && hidden[k]));
        });
        document.querySelectorAll('.dropdown-content a[href^="http"]').forEach(function (a) {
            var k = keyOf(a.getAttribute('href'), a.textContent);
            a.classList.toggle('vys-off', !!(k && hidden[k]));
        });
        var all = Object.keys(window.VYS_DEFAULT_PROJECTS || {}).filter(function (k) { return k !== 'teaching_hub_modal'; });
        var shown = all.filter(function (k) { return !hidden[k]; }).length;
        document.querySelectorAll('[data-vys-count]').forEach(function (el) { el.textContent = shown; });
        document.dispatchEvent(new CustomEvent('vys:visibility', { detail: hidden }));
    }

    var cached = {};
    try { cached = JSON.parse(localStorage.getItem(CACHE) || '{}') || {}; } catch (e) { }
    function start() {
        apply(cached);
        if (!window.VYS_FIREBASE_READY || !window.firebase) return;
        window.VYS_FIREBASE_READY.then(function () {
            firebase.database().ref('site/hidden').on('value', function (snap) {
                var h = snap.val() || {};
                try { localStorage.setItem(CACHE, JSON.stringify(h)); } catch (e) { }
                apply(h);
            }, function (err) { console.warn('[VYS] 無法讀取隱藏清單', err && err.code); });
        }).catch(function () { });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();
