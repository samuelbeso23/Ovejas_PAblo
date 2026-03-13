"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, RotateCcw } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function CameraCapture({ onCapture, onError, className = "" }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Asignar el stream al video cuando el elemento esté montado
  useEffect(() => {
    if (!isStreaming || !streamRef.current || !videoRef.current) return;
    const video = videoRef.current;
    const stream = streamRef.current;
    video.srcObject = stream;
    video.play().catch(() => {});
  }, [isStreaming]);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      // Usar constraints flexibles: environment en móvil, user en desktop
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setIsStreaming(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo acceder a la cámara";
      setError(message);
      onError?.(message);
    }
  }, [onError]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !isStreaming) return;

    const video = videoRef.current;
    // Escalar a mínimo 1920px ancho para mejor OCR
    const minWidth = 1920;
    const scale = Math.max(1, minWidth / video.videoWidth);
    const w = Math.round(video.videoWidth * scale);
    const h = Math.round(video.videoHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, w, h);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          stopCamera();
          onCapture(blob);
        }
      },
      "image/png",
      1
    );
  }, [isStreaming, onCapture, stopCamera]);

  return (
    <div className={`relative ${className}`}>
      {!isStreaming ? (
        <div className="aspect-[4/3] bg-slate-200 rounded-2xl flex flex-col items-center justify-center gap-4">
          <Camera className="w-16 h-16 text-slate-400" />
          <p className="text-slate-600 text-center px-4">
            {error || "Pulsa para abrir la cámara"}
          </p>
          <button
            type="button"
            onClick={startCamera}
            className="btn-primary max-w-xs"
            disabled={!!error}
          >
            Abrir cámara
          </button>
        </div>
      ) : (
        <div className="relative">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="w-full aspect-[4/3] object-cover rounded-2xl bg-black"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-3/4 aspect-[3/4] border-2 border-white/70 rounded-lg" />
          </div>
          <p className="absolute top-2 left-0 right-0 text-center text-white text-sm font-medium drop-shadow">
            Centra el crotal en el recuadro
          </p>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <button
              type="button"
              onClick={stopCamera}
              className="p-4 rounded-full bg-white/90 shadow-lg"
            >
              <RotateCcw className="w-6 h-6 text-slate-700" />
            </button>
            <button
              type="button"
              onClick={capturePhoto}
              className="p-5 rounded-full bg-primary-600 shadow-lg border-4 border-white"
            >
              <Camera className="w-8 h-8 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
