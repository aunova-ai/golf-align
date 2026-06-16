"use client";

import {
  CheckCircle2,
  FileImage,
  Film,
  Camera,
  Upload
} from "lucide-react";
import {
  ChangeEvent,
  useEffect,
  useRef,
  useState
} from "react";
import type { UploadDraft } from "./types";

type Snapshot = {
  id: string;
  label: string;
  timeLabel: string;
  url: string;
};

type MediaInfo = {
  kind: "video" | "image";
  name: string;
  objectUrl: string;
  fileSize: number;
  durationSec?: number;
};

const MAX_UPLOAD_SECONDS = 7;

export function UploadMediaPicker() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaUrlRef = useRef("");
  const snapshotUrlsRef = useRef<string[]>([]);
  const [media, setMedia] = useState<MediaInfo | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [status, setStatus] = useState("파일을 선택하면 자동 썸네일과 피드백용 캡쳐를 준비합니다.");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    mediaUrlRef.current = media?.objectUrl ?? "";
  }, [media?.objectUrl]);

  useEffect(() => {
    snapshotUrlsRef.current = snapshots.map((snapshot) => snapshot.url);
  }, [snapshots]);

  useEffect(() => {
    return () => {
      if (mediaUrlRef.current) {
        URL.revokeObjectURL(mediaUrlRef.current);
      }
      snapshotUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    resetPreview();
    setIsBusy(true);
    setError("");

    const objectUrl = URL.createObjectURL(file);

    try {
      if (file.type.startsWith("video/")) {
        const durationSec = await readVideoDuration(objectUrl);
        const nextMedia = {
          kind: "video" as const,
          name: file.name,
          objectUrl,
          fileSize: file.size,
          durationSec
        };
        setMedia(nextMedia);

        const isLongVideo = durationSec > MAX_UPLOAD_SECONDS;
        setStatus(
          isLongVideo
            ? `${formatBytes(file.size)} 영상입니다. 원본은 기기에 두고, 첫 ${formatSeconds(MAX_UPLOAD_SECONDS)} 기준 썸네일을 만들었습니다.`
            : "영상 길이가 기준 안에 있습니다. 자동 썸네일 3장을 만들었습니다."
        );

        const nextSnapshots = await createVideoSnapshots(objectUrl, 0, Math.min(durationSec, MAX_UPLOAD_SECONDS));
        setSnapshots(nextSnapshots);
        publishDraft(nextMedia, nextSnapshots);
        return;
      }

      if (file.type.startsWith("image/")) {
        setMedia({
          kind: "image",
          name: file.name,
          objectUrl,
          fileSize: file.size
        });
        setStatus("이미지는 바로 스냅샷 기준 이미지로 사용합니다.");
        const imageSnapshot = await createImageSnapshot(objectUrl);
        setSnapshots([imageSnapshot]);
        publishDraft(
          {
            kind: "image",
            name: file.name,
            objectUrl,
            fileSize: file.size
          },
          [imageSnapshot]
        );
        return;
      }

      URL.revokeObjectURL(objectUrl);
      setError("영상 또는 이미지 파일만 선택할 수 있습니다.");
    } catch {
      URL.revokeObjectURL(objectUrl);
      setError("파일을 읽는 중 문제가 생겼습니다. 다른 파일로 다시 시도해 주세요.");
    } finally {
      setIsBusy(false);
    }
  }

  function resetPreview() {
    if (media?.objectUrl) {
      URL.revokeObjectURL(media.objectUrl);
    }
    snapshots.forEach((snapshot) => URL.revokeObjectURL(snapshot.url));
    setMedia(null);
    setSnapshots([]);
    setStatus("파일을 선택하면 자동 썸네일과 피드백용 캡쳐를 준비합니다.");
    setError("");
    window.dispatchEvent(new CustomEvent("golfalign:upload-draft", { detail: null }));
  }

  function publishDraft(nextMedia: MediaInfo, nextSnapshots: Snapshot[]) {
    const draft: UploadDraft = {
      media: nextMedia.kind,
      fileName: nextMedia.name,
      durationLabel:
        nextMedia.kind === "video" ? `원본 ${formatSeconds(nextMedia.durationSec ?? 0)}` : "이미지",
      thumbnailUrl: nextSnapshots[1]?.url ?? nextSnapshots[0]?.url,
      mediaUrl: nextMedia.objectUrl
    };

    window.dispatchEvent(new CustomEvent("golfalign:upload-draft", { detail: draft }));
  }

  function useSampleDraft() {
    resetPreview();
    const thumbnailUrl = createSampleThumbnailDataUrl();
    const sampleDraft: UploadDraft = {
      media: "video",
      fileName: "sample-swing-video.mp4",
      durationLabel: "원본 0:06.0",
      thumbnailUrl
    };
    setMedia({
      kind: "video",
      name: sampleDraft.fileName,
      objectUrl: "",
      fileSize: 640 * 1024,
      durationSec: 6
    });
    setSnapshots([
      {
        id: "sample",
        label: "테스트 썸네일",
        timeLabel: "0:03.0",
        url: thumbnailUrl
      }
    ]);
    setStatus("테스트용 샘플 영상 정보가 준비됐습니다. 저장 흐름을 확인할 수 있습니다.");
    window.dispatchEvent(new CustomEvent("golfalign:upload-draft", { detail: sampleDraft }));
  }

  async function captureCurrentFrame() {
    const video = previewVideoRef.current;
    if (!video || media?.kind !== "video") {
      return;
    }

    setIsBusy(true);
    setError("");
    try {
      const url = await drawVideoFrame(video);
      const nextSnapshot: Snapshot = {
        id: `capture_${Date.now()}`,
        label: "직접 캡쳐",
        timeLabel: formatSeconds(video.currentTime),
        url
      };
      setSnapshots((prev) => {
        const next = [nextSnapshot, ...prev].slice(0, 6);
        prev.slice(5).forEach((snapshot) => URL.revokeObjectURL(snapshot.url));
        publishDraft(media, next);
        return next;
      });
      setStatus("현재 장면을 피드백용 캡쳐 이미지로 추가했습니다.");
    } catch {
      setError("현재 장면 캡쳐에 실패했습니다. 영상을 잠시 멈춘 뒤 다시 시도해 주세요.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="media-picker">
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="video/*,image/*"
        onChange={handleFileChange}
      />

      <button className="upload-box upload-button" onClick={() => inputRef.current?.click()} type="button">
        <Upload size={26} />
        <strong>영상 또는 이미지 선택</strong>
        <p>원본 영상은 기기에 두고, 앱에는 썸네일과 캡쳐 이미지만 가볍게 남깁니다.</p>
      </button>
      <button className="sample-upload-button" onClick={useSampleDraft} type="button">
        테스트용 샘플 영상으로 흐름 확인
      </button>

      {media ? (
        <div className="selected-media">
          <div className="row spread">
              <div className="row">
                <span className="media-type-icon">
                  {media.kind === "video" ? <Film size={19} /> : <FileImage size={19} />}
                </span>
              <div className="media-summary">
                <h3>{media.name}</h3>
                <p>
                  {media.kind === "video"
                    ? `원본 ${formatSeconds(media.durationSec ?? 0)} · 자동 썸네일`
                    : "이미지 파일 · 스냅샷 기준"}
                  {" · "}
                  {formatBytes(media.fileSize)}
                </p>
              </div>
            </div>
            <button className="text-button" onClick={resetPreview} type="button">
              다시 선택
            </button>
          </div>

          {media.kind === "video" ? (
            <div className="video-edit-preview">
              <video ref={previewVideoRef} src={media.objectUrl} controls muted playsInline preload="metadata" />
              <button className="secondary wide" onClick={captureCurrentFrame} type="button" disabled={isBusy}>
                <Camera size={18} />
                현재 장면 캡쳐
              </button>
            </div>
          ) : null}

          {media.kind === "video" && media.durationSec && media.durationSec > MAX_UPLOAD_SECONDS ? (
            <div className="trim-panel light-note">
              <div className="row spread">
                <div>
                  <strong>긴 영상 처리</strong>
                  <p>원본은 저장하지 않고 자동 썸네일과 직접 캡쳐 이미지만 기록합니다.</p>
                </div>
                <Film size={20} />
              </div>
            </div>
          ) : null}

          <div className="upload-status">
            <CheckCircle2 size={18} />
            <span>{isBusy ? "처리 중입니다..." : status}</span>
          </div>
        </div>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}

      {snapshots.length > 0 ? (
        <div className="snapshot-preview-grid">
          {snapshots.map((snapshot) => (
            <figure key={snapshot.id} className="snapshot-preview">
              <img src={snapshot.url} alt={`${snapshot.label} 스냅샷`} />
              <figcaption>
                <strong>{snapshot.label}</strong>
                <span>{snapshot.timeLabel}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function readVideoDuration(objectUrl: string) {
  return new Promise<number>((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.src = objectUrl;
    video.onloadedmetadata = () => resolve(video.duration);
    video.onerror = () => reject(new Error("video metadata error"));
  });
}

async function createVideoSnapshots(objectUrl: string, startSec: number, durationSec: number) {
  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.preload = "metadata";
  video.muted = true;
  video.src = objectUrl;

  await waitForVideoMetadata(video);

  const safeDuration = Math.max(0.1, durationSec);
  const captures = [
    { id: "start", label: "시작 자세", sec: startSec },
    { id: "middle", label: "중간 자세", sec: startSec + safeDuration / 2 },
    { id: "finish", label: "마무리 자세", sec: startSec + safeDuration - 0.08 }
  ];

  const snapshots: Snapshot[] = [];
  for (const capture of captures) {
    const captureSec = clamp(capture.sec, 0, Math.max(0, video.duration - 0.05));
    await seekVideo(video, captureSec);
    const url = await drawVideoFrame(video);
    snapshots.push({
      id: capture.id,
      label: capture.label,
      timeLabel: formatSeconds(captureSec),
      url
    });
  }

  return snapshots;
}

async function createImageSnapshot(objectUrl: string): Promise<Snapshot> {
  const image = new Image();
  image.src = objectUrl;
  await image.decode();

  const canvas = document.createElement("canvas");
  const size = 720;
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("canvas unavailable");
  }

  const scale = Math.max(size / image.width, size / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);

  return {
    id: "image",
    label: "선택 이미지",
    timeLabel: "이미지",
    url: await canvasToObjectUrl(canvas)
  };
}

function waitForVideoMetadata(video: HTMLVideoElement) {
  return new Promise<void>((resolve, reject) => {
    if (Number.isFinite(video.duration) && video.duration > 0) {
      resolve();
      return;
    }

    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("video metadata error"));
  });
}

function seekVideo(video: HTMLVideoElement, sec: number) {
  return new Promise<void>((resolve, reject) => {
    const done = () => {
      video.removeEventListener("seeked", done);
      resolve();
    };
    video.addEventListener("seeked", done);
    video.onerror = () => reject(new Error("video seek error"));
    video.currentTime = sec;
  });
}

function drawVideoFrame(video: HTMLVideoElement) {
  const canvas = document.createElement("canvas");
  const sourceWidth = video.videoWidth || 1280;
  const sourceHeight = video.videoHeight || 720;
  const scale = Math.min(1, 960 / Math.max(sourceWidth, sourceHeight));
  const width = Math.round(sourceWidth * scale);
  const height = Math.round(sourceHeight * scale);
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("canvas unavailable");
  }

  context.drawImage(video, 0, 0, width, height);
  return canvasToObjectUrl(canvas);
}

function canvasToObjectUrl(canvas: HTMLCanvasElement) {
  return new Promise<string>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("snapshot blob error"));
          return;
        }

        resolve(URL.createObjectURL(blob));
      },
      "image/webp",
      0.82
    );
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatSeconds(value: number) {
  const safeValue = Math.max(0, value);
  const minutes = Math.floor(safeValue / 60);
  const seconds = safeValue - minutes * 60;
  return `${minutes}:${seconds.toFixed(1).padStart(4, "0")}`;
}

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

function createSampleThumbnailDataUrl() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="720" height="720" viewBox="0 0 720 720">
      <rect width="720" height="720" fill="#1f5f4a"/>
      <circle cx="560" cy="116" r="74" fill="#f2a900" opacity="0.95"/>
      <path d="M84 560 C178 432 260 354 372 310 C478 268 568 272 642 302" fill="none" stroke="#fff6dd" stroke-width="18" stroke-linecap="round"/>
      <path d="M236 496 L426 294" stroke="#fff6dd" stroke-width="18" stroke-linecap="round"/>
      <circle cx="236" cy="496" r="26" fill="#f2a900"/>
      <circle cx="426" cy="294" r="26" fill="#f2a900"/>
      <text x="72" y="112" fill="#fff6dd" font-family="Arial, sans-serif" font-size="42" font-weight="700">Sample Swing</text>
      <text x="72" y="164" fill="#ffd15d" font-family="Arial, sans-serif" font-size="28" font-weight="700">GolfAlign prototype</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
