// This small, dependency-free guard must work even when the React chunks fail to download.
const startupGuard = `(function () {
  window.__siteReady = false;
  function show() {
    if (window.__siteReady || document.getElementById('site-startup-recovery')) return;
    var box = document.createElement('aside');
    box.id = 'site-startup-recovery';
    box.setAttribute('role', 'status');
    box.style.cssText = 'position:fixed;z-index:2000;bottom:24px;left:5%;width:90%;max-width:600px;padding:16px;border:1px solid #7095ae;border-radius:14px;background:#102637;color:#edf5fc;font:14px/1.7 Arial,sans-serif;box-sizing:border-box';
    var text = document.createElement('p');
    text.textContent = '页面尚未准备完成。加载可能较慢或受到浏览器限制，可继续等待，也可重新加载。';
    text.style.margin = '0 0 10px';
    var button = document.createElement('button');
    button.textContent = '重新加载';
    button.style.cssText = 'min-height:44px;padding:8px 16px;background:transparent;color:inherit;border:1px solid currentColor;border-radius:8px;font:inherit';
    button.onclick = function () { window.location.reload(); };
    box.appendChild(text); box.appendChild(button); document.body.appendChild(box);
  }
  function pendingClick(event) {
    if (!window.__siteReady && event.target.closest && event.target.closest('[data-section], [data-door]')) show();
  }
  var timer = window.setTimeout(show, 12000);
  function ready() {
    window.clearTimeout(timer);
    var box = document.getElementById('site-startup-recovery');
    if (box) box.remove();
    document.removeEventListener('click', pendingClick, true);
    window.removeEventListener('site-ready', ready);
  }
  document.addEventListener('click', pendingClick, true);
  window.addEventListener('site-ready', ready);
})();`;

export function StartupRecovery() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: startupGuard }} />
      <noscript>
        <aside className="no-script-notice">
          此网站的分区浏览需要 JavaScript。请允许浏览器运行脚本后重新打开。
        </aside>
      </noscript>
    </>
  );
}
