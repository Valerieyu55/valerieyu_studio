/* 升學導航：手機「加到主畫面」提示（App 模式）
   - Android / Chrome：攔下 beforeinstallprompt，顯示「安裝」按鈕
   - iPhone Safari：顯示「分享 → 加入主畫面」步驟
   - LINE、IG 等內建瀏覽器無法安裝：提示改用 Safari / Chrome 開啟
   - 已經是 App 模式、桌機、或使用者按過「之後再說」（14 天內）就不顯示 */
(function () {
    'use strict';
    var KEY = 'sxdh_install_dismissed';
    var ua = navigator.userAgent || '';
    var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
    var mobile = /Android|iPhone|iPad|iPod/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua));
    if (standalone || !mobile) return;
    try { var t = +localStorage.getItem(KEY); if (t && Date.now() - t < 14 * 864e5) return; } catch (e) { }

    var ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua));
    var inApp = /Line\/|FBAN|FBAV|Instagram|MicroMessenger/i.test(ua);
    var iosSafari = ios && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua) && !inApp;
    var deferred = null;

    var css = '' +
        '.sx-inst{position:fixed;left:12px;right:12px;bottom:calc(76px + env(safe-area-inset-bottom,0px));z-index:9999;display:flex;gap:12px;align-items:center;padding:12px 12px 12px 14px;' +
        'background:rgba(255,255,255,.97);border:1px solid rgba(216,181,121,.5);border-radius:20px;box-shadow:0 18px 40px -16px rgba(74,59,92,.45);' +
        'font:400 14px/1.5 "Chiron Hei HK","Noto Sans TC",system-ui,sans-serif;color:#4a3b5c;transform:translateY(140%);transition:transform .45s cubic-bezier(.2,.9,.3,1.2)}' +
        '.sx-inst.on{transform:none}.sx-inst img{width:46px;height:46px;border-radius:12px;flex:0 0 auto}' +
        '.sx-inst .t{flex:1;min-width:0}.sx-inst b{display:block;font-weight:500;font-size:15px}.sx-inst small{display:block;color:#7a6c8a;font-size:12.5px}' +
        '.sx-inst .go{border:0;border-radius:999px;padding:9px 16px;background:#82689d;color:#fff;font:inherit;font-weight:500;white-space:nowrap}' +
        '.sx-inst .x{border:0;background:none;color:#a99bb8;font-size:20px;line-height:1;padding:4px 2px 4px 0}' +
        '.sx-inst .ic{display:inline-block;vertical-align:-3px;width:16px;height:16px}';
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

    var share = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="#2f7cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';

    function show(sub, btn) {
        var el = document.createElement('div');
        el.className = 'sx-inst'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', '加到主畫面');
        el.innerHTML = '<img src="icons/icon-192.png" alt=""><div class="t"><b>把升學導航加到主畫面</b><small>' + sub + '</small></div>' +
            (btn ? '<button type="button" class="go">' + btn + '</button>' : '') +
            '<button type="button" class="x" aria-label="之後再說">×</button>';
        document.body.appendChild(el);
        requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('on'); }); });
        function close(remember) {
            el.classList.remove('on'); setTimeout(function () { el.remove(); }, 500);
            if (remember) try { localStorage.setItem(KEY, String(Date.now())); } catch (e) { }
        }
        el.querySelector('.x').onclick = function () { close(true); };
        var go = el.querySelector('.go');
        if (go) go.onclick = function () {
            if (!deferred) return close(true);
            deferred.prompt();
            deferred.userChoice.then(function () { deferred = null; close(true); });
        };
    }

    window.addEventListener('beforeinstallprompt', function (e) {
        e.preventDefault(); deferred = e;
        setTimeout(function () { show('像 App 一樣全螢幕使用，下次一點就開。', '安裝'); }, 2500);
    });
    window.addEventListener('appinstalled', function () { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) { } });

    setTimeout(function () {
        if (deferred || document.querySelector('.sx-inst')) return;
        if (iosSafari) show('點下方 ' + share + ' 分享，再選「加入主畫面」。');
        else if (inApp) show('請先點右上角「⋯」，選用 ' + (ios ? 'Safari' : 'Chrome') + ' 開啟，再加到主畫面。');
        else if (ios) show('請用 Safari 開啟這個網址，再從 ' + share + ' 選「加入主畫面」。');
        else show('點右上角「⋮」，選「安裝應用程式」或「加到主畫面」。');
    }, 4500);
})();
