"use client";

import { useEffect, useRef, useState } from "react";

import type { MensagemWebSocketProdest } from "@/features/carga-org-lot/model";

export type ProdestRealtimeStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "unavailable";

const RECONNECT_DELAYS = [1_000, 2_000, 5_000, 10_000, 30_000];

export function useProdestRealtime({
  channel,
  onMessage,
  onReconnect,
  enabled = true,
}: {
  channel: string;
  onMessage: (message: MensagemWebSocketProdest) => void;
  onReconnect: () => void;
  enabled?: boolean;
}) {
  const [status, setStatus] = useState<ProdestRealtimeStatus>("connecting");
  const messageRef = useRef(onMessage);
  const reconnectRef = useRef(onReconnect);

  useEffect(() => {
    messageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    reconnectRef.current = onReconnect;
  }, [onReconnect]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !("WebSocket" in window)) {
      setStatus("unavailable");
      return;
    }

    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;
    let connectedOnce = false;
    let retryCount = 0;

    const connect = () => {
      if (stopped || !navigator.onLine) {
        setStatus("unavailable");
        return;
      }
      setStatus(connectedOnce ? "reconnecting" : "connecting");
      socket = new WebSocket(buildProdestWebSocketUrl(channel));
      socket.onopen = () => {
        const isReconnect = connectedOnce;
        connectedOnce = true;
        retryCount = 0;
        setStatus("connected");
        if (isReconnect) reconnectRef.current();
      };
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(String(event.data)) as MensagemWebSocketProdest;
          if (message.tipo === "processo_atualizado") messageRef.current(message);
        } catch {
          // Mensagens desconhecidas não devem interromper o acompanhamento.
        }
      };
      socket.onclose = (event) => {
        if (stopped) return;
        if (event.code === 4403) {
          setStatus("unavailable");
          return;
        }
        setStatus("reconnecting");
        const delay = RECONNECT_DELAYS[Math.min(retryCount, RECONNECT_DELAYS.length - 1)];
        retryCount += 1;
        retryTimer = setTimeout(connect, delay);
      };
      socket.onerror = () => socket?.close();
    };

    const handleOnline = () => {
      if (socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) return;
      if (retryTimer) clearTimeout(retryTimer);
      connect();
    };

    window.addEventListener("online", handleOnline);
    connect();
    return () => {
      stopped = true;
      window.removeEventListener("online", handleOnline);
      if (retryTimer) clearTimeout(retryTimer);
      socket?.close();
    };
  }, [channel, enabled]);

  return status;
}

export function buildProdestWebSocketUrl(channel: string) {
  const configuredBase = process.env.NEXT_PUBLIC_API_URL?.trim();
  const url = new URL(configuredBase || window.location.origin, window.location.origin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = channel.startsWith("/") ? channel : `/${channel}`;
  url.search = "";
  url.hash = "";
  return url.toString();
}
