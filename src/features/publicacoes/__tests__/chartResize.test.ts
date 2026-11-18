import { afterEach, describe, expect, it, vi } from "vitest";

import { observeChartResize } from "@/features/publicacoes/chartResize";

describe("observeChartResize", () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it("recalcula o gráfico quando a página volta a ficar visível", () => {
    vi.useFakeTimers();
    const container = document.createElement("div");
    document.body.append(container);
    let width = 640;
    let height = 360;
    Object.defineProperties(container, {
      clientWidth: { configurable: true, get: () => width },
      clientHeight: { configurable: true, get: () => height },
    });
    const resize = vi.fn();
    const stop = observeChartResize(container, resize);
    expect(resize).toHaveBeenCalledWith(640, 360);

    width = 960;
    height = 540;
    document.dispatchEvent(new Event("visibilitychange"));
    expect(resize).toHaveBeenLastCalledWith(960, 540);
    vi.runAllTimers();
    expect(resize).toHaveBeenLastCalledWith(960, 540);

    stop();
    resize.mockClear();
    document.dispatchEvent(new Event("fullscreenchange"));
    vi.runAllTimers();
    expect(resize).not.toHaveBeenCalled();
  });
});
