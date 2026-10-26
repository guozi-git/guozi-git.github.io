export function markSiteReady() {
  (window as Window & { __siteReady?: boolean }).__siteReady = true;
  window.dispatchEvent(new Event('site-ready'));
}
