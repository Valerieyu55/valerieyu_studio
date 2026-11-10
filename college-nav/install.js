/* 升學導航：主動安裝成手機 App
   - 不自動跳出任何提示（連 Chrome 自己的「加到主畫面」小橫幅也擋掉）
   - 手機的頁尾連結列會多一個「安裝成手機 App」，使用者自己按了才開始安裝
     · Android / Chrome：直接跳出系統的安裝視窗
     · iPhone Safari：顯示「分享 → 加入主畫面」步驟
     · LINE、IG 等內建瀏覽器：提示改用 Safari / Chrome 開啟
   - 已經是 App 模式或在電腦上就不顯示 */
(function () {
    'use strict';
    var deferred = null;
    window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; });

    var ua = navigator.userAgent || '';
    var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
    var ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua));
    var mobile = ios || /Android/i.test(ua);
    if (standalone || !mobile) return;
    var inApp = /Line\/|FBAN|FBAV|Instagram|MicroMessenger/i.test(ua);
    var iosSafari = ios && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua) && !inApp;

    var css = '' +
        '.sx-inst{position:fixed;left:12px;right:12px;bottom:calc(76px + env(safe-area-inset-bottom,0px));z-index:9999;display:flex;gap:12px;align-items:center;padding:12px 12px 12px 14px;' +
        'background:rgba(255,255,255,.97);border:1px solid rgba(216,181,121,.5);border-radius:20px;box-shadow:0 18px 40px -16px rgba(74,59,92,.45);' +
        'font:400 14px/1.5 "Chiron Hei HK","Noto Sans TC",system-ui,sans-serif;color:#4a3b5c}' +
        '.sx-inst img{width:46px;height:46px;border-radius:12px;flex:0 0 auto}.sx-inst .t{flex:1;min-width:0}' +
        '.sx-inst b{display:block;font-weight:500;font-size:15px}.sx-inst small{display:block;color:#7a6c8a;font-size:12.5px}' +
        '.sx-inst .x{border:0;background:none;color:#a99bb8;font-size:22px;line-height:1;padding:4px 2px 4px 0}' +
        '.sx-inst .ic{display:inline-block;vertical-align:-3px;width:16px;height:16px}';
    var share = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="#2f7cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';

    function guide(text) {
        var old = document.querySelector('.sx-inst'); if (old) old.remove();
        if (!document.getElementById('sx-inst-css')) { var st = document.createElement('style'); st.id = 'sx-inst-css'; st.textContent = css; document.head.appendChild(st); }
        var el = document.createElement('div');
        el.className = 'sx-inst'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', '安裝成手機 App');
        el.innerHTML = '<img src="icons/icon-192.png" alt=""><div class="t"><b>安裝成手機 App</b><small>' + text + '</small></div><button type="button" class="x" aria-label="關閉">×</button>';
        el.querySelector('.x').onclick = function () { el.remove(); };
        document.body.appendChild(el);
    }

    function install(e) {
        if (e) e.preventDefault();
        if (deferred) { deferred.prompt(); deferred.userChoice.then(function () { deferred = null; }); return; }
        if (iosSafari) guide('點下方 ' + share + ' 分享，再選「加入主畫面」。');
        else if (inApp) guide('請先點右上角「⋯」，選用 ' + (ios ? 'Safari' : 'Chrome') + ' 開啟，再按一次「安裝成手機 App」。');
        else if (ios) guide('請用 Safari 開啟這個網址，再從 ' + share + ' 選「加入主畫面」。');
        else guide('點右上角「⋮」，選「安裝應用程式」或「加到主畫面」。');
    }
    window.SXDH_install = install;

    function addLink() {
        var nav = document.querySelector('.ft-links');
        if (!nav || nav.querySelector('[data-install]')) return;
        var a = document.createElement('a');
        a.href = '#'; a.setAttribute('data-install', '');
        a.innerHTML = '<span>安裝成手機 App</span><i>↓</i>';
        a.addEventListener('click', install);
        nav.insertBefore(a, nav.firstChild);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addLink); else addLink();
})();
