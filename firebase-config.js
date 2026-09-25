/**
 * Valerie Yu Studio - Firebase Configuration & Analytics Service
 * 支援即時在線人數 (Presence)、累積造訪人次 (Total Visits) 與專案連結點擊追蹤 (Link Clicks)
 */

// 預設專案清單與初始權重（用於首次初始化資料庫或未設定時之本機展示）
window.VYS_DEFAULT_PROJECTS = {
    'measure_quest': {
        title: '測量遠征：一束光，丈量一個世界',
        category: '數學探究',
        url: 'https://valerieyu55.github.io/measure-quest/',
        count: 0
    },
    'math3b_radian': {
        title: '高中數學 3B：弧度量與週期性數學模型',
        category: '高中數學',
        url: 'https://valerieyu55.github.io/math3b-radian-periodic-lab/',
        count: 0
    },
    'store_manager': {
        title: '國中數學 3上：1-1 連比例與手搖飲創業專案',
        category: '國中數學',
        url: 'https://valerieyu55.github.io/store_manager/',
        count: 0
    },
    'geometry_3d': {
        title: '從平面到立體：空間幾何的思維躍遷',
        category: '高中數學',
        url: 'https://valerieyu55.github.io/3-1-geometry/index.html',
        count: 0
    },
    'geometry_qdes': {
        title: '空間幾何體・動態探索系統',
        category: '幾何探究',
        url: 'https://valerieyu55.github.io/geometry_qdes/',
        count: 0
    },
    'parabola_court': {
        title: '課堂教案：拋物線・看見數學的軌跡',
        category: '二次函數',
        url: 'https://valerieyu55.github.io/MATH.COURT/',
        count: 0
    },
    'g9_stat_prob': {
        title: '國中數學 3下：統計與機率',
        category: '國中數學',
        url: 'https://valerieyu55.github.io/G9/',
        count: 0
    },
    'math_ab_guide': {
        title: '108課綱：高二數學A與數學B選修指南',
        category: '升學輔導',
        url: 'https://valerieyu55.github.io/math_ab/',
        count: 0
    },
    'proxy_calculator': {
        title: '代導費用 Calculator',
        category: '教師工具',
        url: 'https://valerieyu55.github.io/proxy-teacher-calculator/',
        count: 0
    },
    'teaching_hub_modal': {
        title: '數位教學探索中心 (Teaching Hub)',
        category: '教學互動',
        url: '#teaching-modal',
        count: 0
    }
};

// 取得 Firebase 組態（優先讀取 localStorage 中管理員設定的組態，若無則讀取靜態預設）
function getStoredFirebaseConfig() {
    try {
        const local = localStorage.getItem('vys_firebase_config');
        if (local) {
            const parsed = JSON.parse(local);
            if (parsed && parsed.apiKey && parsed.databaseURL) {
                return parsed;
            }
        }
    } catch (e) {
        console.warn('Failed to parse local firebase config', e);
    }
    
    // 【余老師專屬 Firebase 雲端資料庫正式組態】
    return {
        apiKey: "AIzaSyBzY-NCs--lfAENbFiJn_ClOgk3LmhCSGk",
        authDomain: "valerie-yu-studio.firebaseapp.com",
        databaseURL: "https://valerie-yu-studio-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "valerie-yu-studio",
        storageBucket: "valerie-yu-studio.firebasestorage.app",
        messagingSenderId: "958979961067",
        appId: "1:958979961067:web:b9848fed08664539920eae",
        measurementId: "G-BTCYBQYREQ"
    };
}

window.VYS_FIREBASE_CONFIG = getStoredFirebaseConfig();

// 初始化 Firebase 實例
(function initVYSFirebase() {
    const config = window.VYS_FIREBASE_CONFIG;
    const isValid = config && config.apiKey && config.databaseURL;

    if (isValid && typeof firebase !== 'undefined') {
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(config);
            }
            window.VYS_DB_INSTANCE = firebase.database();
            if (config.measurementId && typeof firebase.analytics === 'function') {
                try {
                    firebase.analytics();
                } catch (e) {}
            }
            console.log('✨ [VYS Analytics] Firebase Realtime Database 連線成功！');
        } catch (err) {
            console.error('❌ [VYS Analytics] Firebase 初始化失敗:', err);
        }
    } else {
        // 未配置 Firebase 時啟動本機展示 / 離線暫存模式
        console.info('💡 [VYS Analytics] 目前處於本機模擬展示模式，可在管理後台 (admin.html) 輸入 Firebase 組態以啟用即時同步。');
    }
})();
