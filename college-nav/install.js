/* 升學導航：App 模式
   不自動跳出任何安裝提示（連 Chrome 自己的「加到主畫面」小橫幅也擋掉）。
   想裝成 App 的人：Android 從右上角「⋮」選「安裝應用程式」，iPhone 從 Safari 分享鈕選「加入主畫面」。 */
window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); });
