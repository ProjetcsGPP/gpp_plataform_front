export interface VideoExportFormat {
  extension: "mp4" | "webm";
  label: "MP4" | "WebM";
  mimeType: string;
}

export const VIDEO_EXPORT_STOP_GRACE_MS = 5000;

export interface PublicationDisplayMediaOptions extends DisplayMediaStreamOptions {
  monitorTypeSurfaces?: "include" | "exclude";
  preferCurrentTab?: boolean;
  selfBrowserSurface?: "include" | "exclude";
  surfaceSwitching?: "include" | "exclude";
}

const VIDEO_EXPORT_CANDIDATES: readonly VideoExportFormat[] = [
  { mimeType: "video/mp4;codecs=avc1.42E01E", extension: "mp4", label: "MP4" },
  { mimeType: "video/mp4", extension: "mp4", label: "MP4" },
  { mimeType: "video/webm;codecs=vp9", extension: "webm", label: "WebM" },
  { mimeType: "video/webm;codecs=vp8", extension: "webm", label: "WebM" },
  { mimeType: "video/webm", extension: "webm", label: "WebM" },
];

export function detectVideoExportFormat(
  isTypeSupported: ((mimeType: string) => boolean) | undefined =
    typeof MediaRecorder === "undefined"
      ? undefined
      : MediaRecorder.isTypeSupported.bind(MediaRecorder),
): VideoExportFormat | null {
  if (!isTypeSupported) return null;
  return VIDEO_EXPORT_CANDIDATES.find(({ mimeType }) => isTypeSupported(mimeType)) ?? null;
}

export function videoExportIsAvailable() {
  return typeof window !== "undefined"
    && window.isSecureContext
    && typeof navigator.mediaDevices?.getDisplayMedia === "function"
    && typeof MediaRecorder !== "undefined";
}

export function videoExportFileName(competencia: string, versao: number, extension: VideoExportFormat["extension"]) {
  const safeCompetency = competencia.replace(/[^0-9A-Za-z_-]+/g, "-");
  return `publicacao-${safeCompetency}-v${versao}.${extension}`;
}

export function videoExportWatchdogDelay(durations: number[]) {
  return durations.reduce((total, duration) => total + duration, 0) * 1000
    + VIDEO_EXPORT_STOP_GRACE_MS;
}

export function publicationDisplayMediaOptions(): PublicationDisplayMediaOptions {
  return {
    audio: false,
    video: {
      displaySurface: "browser",
      frameRate: 30,
    },
    monitorTypeSurfaces: "exclude",
    preferCurrentTab: true,
    selfBrowserSurface: "include",
    surfaceSwitching: "exclude",
  };
}

export function videoExportErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") return "A captura foi cancelada ou não foi autorizada pelo navegador.";
    if (error.name === "NotFoundError") return "Nenhuma superfície disponível para captura foi encontrada.";
    if (error.name === "InvalidStateError") return "Inicie a gravação novamente por meio do botão da página.";
    if (error.name === "NotReadableError") return "O navegador não conseguiu acessar a superfície selecionada.";
  }
  if (error instanceof Error && error.message) return error.message;
  return "Não foi possível gerar o vídeo desta publicação.";
}

export function downloadVideoBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
