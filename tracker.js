/**
 * Valerie Yu Studio - Real-time Visitor & Click Tracking Engine
 * 負責前端即時在線連線 (Presence)、累積人次統計、連結點擊自動攔截追蹤
 */

(function () {
    'use strict';

    // 1. 建立或讀取當前分頁 Session ID
    let sessionId = sessionStorage.getItem('vys_session_id');
    if (!sessionId) {
        sessionId = 'sess_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
        sessionStorage.setItem('vys_session_id', sessionId);
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const db = window.VYS_DB_INSTANCE;

    // 2. 本地儲存備援數據（當尚未填入 Firebase Key 時的預覽模式）
    function getLocalAnalytics() {
        try {
            const raw = localStorage.getItem('vys_mock_analytics');
            if (raw) return JSON.parse(raw);
        } catch (e) {}

        const initial = {
            total_visits: 1268,
            daily_visits: { [todayStr]: 38 },
            clicks: JSON.parse(JSON.stringify(window.VYS_DEFAULT_PROJECTS || {})),
            recent_events: [
                { type: 'visit', title: '訪客進入首頁', timestamp: Date.now() - 1000 * 60 * 3 },
                { type: 'click', title: '測量遠征：一束光，丈量一個世界', timestamp: Date.now() - 1000 * 60 * 8 },
                { type: 'click', title: '高中數學 3B：弧度量與週期性數學模型', timestamp: Date.now() - 1000 * 60 * 22 }
            ]
        };
        // 給予預設點閱數，呈現活潑排行榜
        const sampleCounts = {
            'measure_quest': 214,
            'math3b_radian': 188,
            'store_manager': 165,
            'geometry_3d': 132,
            'teaching_hub_modal': 118,
            'geometry_qdes': 96,
            'parabola_court': 85,
            'proxy_calculator': 74,
            'g9_stat_prob': 67,
            'math_ab_guide': 59
        };
        for (const k in sampleCounts) {
            if (initial.clicks[k]) {
                initial.clicks[k].count = sampleCounts[k];
                initial.clicks[k].lastClicked = Date.now() - Math.floor(Math.random() * 86400000 * 2);
            }
        }
        localStorage.setItem('vys_mock_analytics', JSON.stringify(initial));
        return initial;
    }

    function saveLocalAnalytics(data) {
        try {
            localStorage.setItem('vys_mock_analytics', JSON.stringify(data));
        } catch (e) {}
    }

    // 3. 即時在線人數追蹤 (Presence System)
    if (db) {
        const userStatusRef = db.ref('online_users/' + sessionId);
        const connectedRef = db.ref('.info/connected');

        connectedRef.on('value', function (snap) {
            if (snap.val() === true) {
                // 當連線中斷（訪客關閉分頁或視窗）時，Firebase 雲端自動將此 session 刪除
                userStatusRef.onDisconnect().remove();

                // 寫入當前訪客連線紀錄
                userStatusRef.set({
                    joinedAt: firebase.database.ServerValue.TIMESTAMP,
                    lastActive: firebase.database.ServerValue.TIMESTAMP,
                    path: window.location.pathname,
                    referrer: document.referrer || 'direct'
                });
            }
        });

        // 監聽線上總人數並同步至頁面
        db.ref('online_users').on('value', function (snap) {
            const count = snap.numChildren();
            updateOnlineDisplay(count > 0 ? count : 1);
        });

        // 4. 累積造訪次數統計 (全域與當日)
        if (!sessionStorage.getItem('vys_counted')) {
            sessionStorage.setItem('vys_counted', '1');
            db.ref('analytics/total_visits').transaction(function (current) {
                return (current || 0) + 1;
            });
            db.ref('analytics/daily_visits/' + todayStr).transaction(function (current) {
                return (current || 0) + 1;
            });

            // 紀錄造訪事件
            logRecentEvent('visit', '訪客瀏覽頁面 (' + document.title.split('|')[0].trim() + ')');
        }

        // 監聽累積造訪人數並同步至頁面
        db.ref('analytics/total_visits').on('value', function (snap) {
            const total = snap.val() || 0;
            updateVisitsDisplay(total);
        });

    } else {
        // 本機預覽備援邏輯
        const local = getLocalAnalytics();
        if (!sessionStorage.getItem('vys_counted')) {
            sessionStorage.setItem('vys_counted', '1');
            local.total_visits = (local.total_visits || 0) + 1;
            local.daily_visits[todayStr] = (local.daily_visits[todayStr] || 0) + 1;
            saveLocalAnalytics(local);
        }
        updateOnlineDisplay(2); // 預設目前線上 2 人 (含自己)
        updateVisitsDisplay(local.total_visits);
    }

    // 5. 畫面數值更新 Helper
    function updateOnlineDisplay(count) {
        document.querySelectorAll('#stats-online-count, [data-vys-online]').forEach(el => {
            el.textContent = count;
        });
    }

    function updateVisitsDisplay(count) {
        document.querySelectorAll('#stats-total-visits, [data-vys-visits]').forEach(el => {
            el.textContent = Number(count).toLocaleString();
        });
    }

    // 紀錄最近動態
    function logRecentEvent(type, title) {
        const eventItem = {
            type: type,
            title: title,
            timestamp: Date.now()
        };

        if (db) {
            const ref = db.ref('analytics/recent_events');
            ref.push(eventItem);
            // 僅保留最新 30 筆
            ref.limitToLast(30);
        } else {
            const local = getLocalAnalytics();
            local.recent_events = local.recent_events || [];
            local.recent_events.unshift(eventItem);
            if (local.recent_events.length > 30) local.recent_events.pop();
            saveLocalAnalytics(local);
        }
    }

    // 6. 核心點擊追蹤函式 (全域公開)
    window.VYS_TRACK_CLICK = function (projectKey, projectTitle, targetUrl, category) {
        if (!projectKey) return;
        console.log('📌 [VYS Click Tracked]:', projectKey, projectTitle);

        if (db) {
            const itemRef = db.ref('analytics/clicks/' + projectKey);
            itemRef.transaction(function (item) {
                if (!item) {
                    item = {
                        title: projectTitle || projectKey,
                        url: targetUrl || '',
                        category: category || '一般',
                        count: 0,
                        lastClicked: 0
                    };
                }
                item.count = (item.count || 0) + 1;
                item.lastClicked = Date.now();
                if (projectTitle) item.title = projectTitle;
                if (targetUrl) item.url = targetUrl;
                if (category) item.category = category;
                return item;
            });

            logRecentEvent('click', projectTitle || projectKey);
        } else {
            // 本機備援
            const local = getLocalAnalytics();
            local.clicks = local.clicks || {};
            if (!local.clicks[projectKey]) {
                local.clicks[projectKey] = {
                    title: projectTitle || projectKey,
                    url: targetUrl || '',
                    category: category || '一般',
                    count: 0,
                    lastClicked: 0
                };
            }
            local.clicks[projectKey].count = (local.clicks[projectKey].count || 0) + 1;
            local.clicks[projectKey].lastClicked = Date.now();
            saveLocalAnalytics(local);
            logRecentEvent('click', projectTitle || projectKey);
        }
    };

    // 7. 自動掛載各作品卡片與按鈕的點擊監聽器
    function autoBindClickTracking() {
        // 對象 A: 首頁專案卡片中的 View Project 按鈕
        document.querySelectorAll('.featured-item').forEach(card => {
            const titleEl = card.querySelector('.featured-title');
            const linkEl = card.querySelector('.featured-details a.btn');
            const tagEl = card.querySelector('.featured-tag');
            if (!linkEl || !titleEl) return;

            const title = titleEl.textContent.trim();
            const url = linkEl.getAttribute('href');
            const category = tagEl ? tagEl.textContent.trim() : '教學模組';
            const key = deriveProjectKey(url, title);

            linkEl.addEventListener('click', function () {
                window.VYS_TRACK_CLICK(key, title, url, category);
            });
        });

        // 對象 B: Teaching Hub 彈窗內的卡片
        document.querySelectorAll('.teaching-card').forEach(card => {
            const titleEl = card.querySelector('h5');
            const badgeEl = card.querySelector('.teaching-card-badge');
            const url = card.getAttribute('href');
            if (!titleEl || !url) return;

            const title = titleEl.textContent.trim();
            const category = badgeEl ? badgeEl.textContent.trim() : '教學實驗室';
            const key = deriveProjectKey(url, title);

            card.addEventListener('click', function () {
                window.VYS_TRACK_CLICK(key, title, url, category);
            });
        });

        // 對象 C: 首頁 Hero 按鈕
        const btnViewTeaching = document.getElementById('btn-view-teaching');
        if (btnViewTeaching) {
            btnViewTeaching.addEventListener('click', function () {
                window.VYS_TRACK_CLICK('teaching_hub_modal', '數位教學探索中心 (Teaching Hub 彈窗)', '#teaching-modal', '教學導覽');
            });
        }
    }

    // 輔助工具：根據網址與標題推導乾淨的 key
    function deriveProjectKey(url, title) {
        if (!url) return 'unknown';
        if (url.includes('measure-quest')) return 'measure_quest';
        if (url.includes('math3b-radian')) return 'math3b_radian';
        if (url.includes('store_manager')) return 'store_manager';
        if (url.includes('3-1-geometry')) return 'geometry_3d';
        if (url.includes('geometry_qdes')) return 'geometry_qdes';
        if (url.includes('MATH.COURT')) return 'parabola_court';
        if (url.includes('G9')) return 'g9_stat_prob';
        if (url.includes('math_ab')) return 'math_ab_guide';
        if (url.includes('proxy-teacher-calculator')) return 'proxy_calculator';
        return title.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_').substring(0, 30);
    }

    // 8. 專屬快捷鍵：在任何頁面按下 Ctrl+Shift+A 或 Cmd+Shift+A 即可直達數據戰情室
    document.addEventListener('keydown', function (e) {
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
            e.preventDefault();
            window.location.href = 'admin.html';
        }
    });

    // DOM Ready 時自動執行綁定
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoBindClickTracking);
    } else {
        autoBindClickTracking();
    }
})();
