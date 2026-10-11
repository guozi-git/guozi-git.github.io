// Motion is a site preference: full by default, independent of the OS setting.
export function reducedMotion() {
  return typeof document !== 'undefined' && document.documentElement.dataset.motion === 'reduced';
}
