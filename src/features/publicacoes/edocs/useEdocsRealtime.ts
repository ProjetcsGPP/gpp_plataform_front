"use client";

import { useEffect, useRef } from "react";

import type { MensagemEdocsWebSocket } from "@/features/publicacoes/edocs/model";

const CHANNEL = "/ws/pub-institucional/edocs/";
const RECONNECT_DELAYS = [1_000, 2_000, 5_000, 10_000, 30_000];

export function useEdocsRealtime(onSignal: () => void) {
  const signalRef = useRef(onSignal);

  useEffect(() => {
    signalRef.current = onSignal;
  }, [onSignal]);

  useEffect(() => {
    if (typeof window === "undefined" || !("WebSocket" in window)) return;

    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;
    let retryCount = 0;
    let connectedOnce = false;

    const connect = () => {
      if (stopped || !navigator.onLine) return;
      socket = new WebSocket(buildEdocsWebSocketUrl());
      socket.onopen = () => {
        const reconnected = connectedOnce;
        connectedOnce = true;
        retryCount = 0;
        if (reconnected) signalRef.current();
      };
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(String(event.data)) as MensagemEdocsWebSocket;
          if (typeof message.evento === "string") signalRef.current();
        } catch {
          // Mensagens desconhecidas não alteram o estado canônico HTTP.
        }
      };
      socket.onclose = (event) => {
        if (stopped || event.code === 4403) return;
        const delay = RECONNECT_DELAYS[
          Math.min(retryCount, RECONNECT_DELAYS.length - 1)
        ];
        retryCount += 1;
        retryTimer = setTimeout(connect, delay);
      };
      socket.onerror = () => socket?.close();
    };

    const handleOnline = () => {
      if (
        socket?.readyState === WebSocket.OPEN ||
        socket?.readyState === WebSocket.CONNECTING
      ) {
        return;
      }
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
  }, []);
}

export function buildEdocsWebSocketUrl() {
  const configuredBase = process.env.NEXT_PUBLIC_API_URL?.trim();
  const url = new URL(
    configuredBase || window.location.origin,
    window.location.origin,
  );
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = CHANNEL;
  url.search = "";
  url.hash = "";
  return url.toString();
}
