type Connection = { saveData?: boolean; effectiveType?: string; downlink?: number; rtt?: number };

// Speculation is optional. User-triggered imports still work on every browser/network.
export function scheduleIdlePreload(load: () => Promise<unknown>, eligible: () => boolean) {
  let cancelled = false;
  let timer: number | undefined;
  let idle: number | undefined;
  const permitted = () => {
    const connection = (navigator as Navigator & { connection?: Connection }).connection;
    return (
      !cancelled &&
      document.visibilityState === 'visible' &&
      eligible() &&
      connection?.effectiveType === '4g' &&
      !connection.saveData &&
      (connection.downlink === undefined || connection.downlink >= 1.5) &&
      (connection.rtt === undefined || connection.rtt <= 250)
    );
  };
  const afterLoad = () => {
    if (!permitted() || !('requestIdleCallback' in window)) return;
    timer = window.setTimeout(() => {
      if (!permitted()) return;
      idle = window.requestIdleCallback(() => {
        if (permitted()) void load().catch(() => undefined);
      });
    }, 1000);
  };
  if (document.readyState === 'complete') afterLoad();
  else window.addEventListener('load', afterLoad, { once: true });
  return () => {
    cancelled = true;
    window.removeEventListener('load', afterLoad);
    if (timer !== undefined) window.clearTimeout(timer);
    if (idle !== undefined) window.cancelIdleCallback(idle);
  };
}
