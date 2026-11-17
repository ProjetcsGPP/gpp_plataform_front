type ChartResize = (width: number, height: number) => void;

export function observeChartResize(container: HTMLElement, resize: ChartResize) {
  let disposed = false;
  let lastWidth = 0;
  let lastHeight = 0;
  const frames = new Set<number>();
  const timers = new Set<number>();

  function sync(force = false) {
    if (disposed || !container.isConnected) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width <= 0 || height <= 0) return;
    if (!force && width === lastWidth && height === lastHeight) return;
    lastWidth = width;
    lastHeight = height;
    resize(width, height);
  }

  function scheduleRecovery() {
    sync(true);
    const frame = window.requestAnimationFrame(() => {
      frames.delete(frame);
      sync(true);
    });
    frames.add(frame);
    for (const delay of [150, 500]) {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        sync(true);
      }, delay);
      timers.add(timer);
    }
  }

  function handleVisibilityChange() {
    if (document.visibilityState === "visible") scheduleRecovery();
  }

  const observer = typeof ResizeObserver === "undefined"
    ? null
    : new ResizeObserver(() => sync());
  observer?.observe(container);
  window.addEventListener("resize", scheduleRecovery);
  window.addEventListener("pageshow", scheduleRecovery);
  document.addEventListener("fullscreenchange", scheduleRecovery);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  scheduleRecovery();

  return () => {
    disposed = true;
    observer?.disconnect();
    window.removeEventListener("resize", scheduleRecovery);
    window.removeEventListener("pageshow", scheduleRecovery);
    document.removeEventListener("fullscreenchange", scheduleRecovery);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    frames.forEach((frame) => window.cancelAnimationFrame(frame));
    timers.forEach((timer) => window.clearTimeout(timer));
  };
}
