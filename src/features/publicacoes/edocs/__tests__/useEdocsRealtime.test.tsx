import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildEdocsWebSocketUrl,
  useEdocsRealtime,
} from "@/features/publicacoes/edocs/useEdocsRealtime";

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
  }
}

describe("sinais em tempo real E-Docs", () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.stubGlobal("WebSocket", FakeWebSocket);
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.exemplo.gov.br/api");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("monta a URL dedicada sem token na query string", () => {
    expect(buildEdocsWebSocketUrl()).toBe(
      "wss://api.exemplo.gov.br/ws/pub-institucional/edocs/",
    );
  });

  it("usa a mensagem somente como sinal de revalidação", () => {
    const onSignal = vi.fn();
    const hook = renderHook(() => useEdocsRealtime(onSignal));
    const socket = FakeWebSocket.instances[0];

    act(() => socket.open());
    act(() =>
      socket.message({
        evento: "edocs.mensal.coleta.reencaminhada",
        dados: {
          coleta_id: "11111111-1111-1111-1111-111111111111",
          situacao: "valor-que-nao-deve-ser-aplicado-localmente",
        },
      }),
    );

    expect(onSignal).toHaveBeenCalledOnce();
    hook.unmount();
  });
});
