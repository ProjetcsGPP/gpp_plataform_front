import { describe, expect, it, vi } from "vitest";

import {
  detectVideoExportFormat,
  publicationDisplayMediaOptions,
  videoExportErrorMessage,
  videoExportFileName,
  videoExportWatchdogDelay,
} from "../videoExport";

describe("exportação de publicação em vídeo", () => {
  it("prioriza MP4 quando o codificador está disponível", () => {
    const isTypeSupported = vi.fn((mimeType: string) => mimeType === "video/mp4");
    expect(detectVideoExportFormat(isTypeSupported)).toEqual({
      extension: "mp4",
      label: "MP4",
      mimeType: "video/mp4",
    });
  });

  it("usa WebM como fallback sem renomear o contêiner", () => {
    const format = detectVideoExportFormat((mimeType) => mimeType === "video/webm;codecs=vp8");
    expect(format).toEqual({
      extension: "webm",
      label: "WebM",
      mimeType: "video/webm;codecs=vp8",
    });
    expect(videoExportFileName("2026/10", 2, format!.extension)).toBe("publicacao-2026-10-v2.webm");
  });

  it("traduz o cancelamento da permissão sem expor detalhes internos", () => {
    expect(videoExportErrorMessage(new DOMException("denied", "NotAllowedError")))
      .toBe("A captura foi cancelada ou não foi autorizada pelo navegador.");
  });

  it("impõe encerramento após a soma das etapas e uma tolerância curta", () => {
    expect(videoExportWatchdogDelay([2, 3, 4])).toBe(14_000);
  });

  it("solicita que a guia atual seja priorizada pelo navegador", () => {
    expect(publicationDisplayMediaOptions()).toMatchObject({
      monitorTypeSurfaces: "exclude",
      preferCurrentTab: true,
      selfBrowserSurface: "include",
      surfaceSwitching: "exclude",
      video: { displaySurface: "browser", frameRate: 30 },
    });
  });
});
