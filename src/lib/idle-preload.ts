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
      (!connection ||
        (connection.effectiveType === '4g' &&
          !connection.saveData &&
          (connection.downlink === undefined || connection.downlink >= 1.5) &&
          (connection.rtt === undefined || connection.rtt <= 250)))
    );
  };
  const afterLoad = () => {
    if (!permitted()) return;
    const knownNetwork = !!(navigator as Navigator & { connection?: Connection }).connection;
    timer = window.setTimeout(
      () => {
        if (!permitted()) return;
        const warm = () => {
          if (permitted()) void load().catch(() => undefined);
        };
        if (typeof window.requestIdleCallback === 'function')
          idle = window.requestIdleCallback(warm);
        else timer = window.setTimeout(warm, 0);
      },
      knownNetwork ? 1000 : 3000,
    );
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
