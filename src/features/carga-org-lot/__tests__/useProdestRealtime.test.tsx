import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildProdestWebSocketUrl,
  useProdestRealtime,
} from "@/features/carga-org-lot/useProdestRealtime";

class FakeWebSocket {
  static OPEN = 1;
  static CONNECTING = 0;
  static instances: FakeWebSocket[] = [];

  url: string;
  readyState = FakeWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: ((event: { code: number }) => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  open() {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }

  message(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  close() {
    this.readyState = 3;
    this.onclose?.({ code: 1006 });
  }
}

describe("acompanhamento em tempo real da PRODEST", () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.stubGlobal("WebSocket", FakeWebSocket);
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.exemplo.gov.br/api");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("monta a URL segura sem enviar token na query string", () => {
    expect(buildProdestWebSocketUrl("/ws/carga-org-lot/dashboard/")).toBe(
      "wss://api.exemplo.gov.br/ws/carga-org-lot/dashboard/",
    );
  });

  it("entrega atualizações e recupera o estado após reconectar", () => {
    vi.useFakeTimers();
    const onMessage = vi.fn();
    const onReconnect = vi.fn();
    const hook = renderHook(() => useProdestRealtime({
      channel: "/ws/carga-org-lot/patriarcas/1/",
      onMessage,
      onReconnect,
    }));

    const first = FakeWebSocket.instances[0];
    act(() => first.open());
    expect(hook.result.current).toBe("connected");
    act(() => first.message({ tipo: "processo_atualizado", processo: { envio_id: 10 } }));
    expect(onMessage).toHaveBeenCalledOnce();

    act(() => first.close());
    expect(hook.result.current).toBe("reconnecting");
    act(() => vi.advanceTimersByTime(1_000));
    const second = FakeWebSocket.instances[1];
    act(() => second.open());
    expect(onReconnect).toHaveBeenCalledOnce();
    expect(hook.result.current).toBe("connected");
    hook.unmount();
  });
});
