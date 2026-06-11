import type { ImageCropRect } from "@/lib/imageCompression";
import { Check, Minus, Plus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type CropBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ImageSize = {
  width: number;
  height: number;
};

type ImageCropModalProps = {
  file: File;
  aspectRatio: number;
  title: string;
  onCancel: () => void;
  onConfirm: (cropRect: ImageCropRect) => Promise<void> | void;
};

const minFrameScale = 0.45;
const maxFrameScale = 0.95;
const defaultFrameScale = 0.82;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function buildCropBox(
  display: ImageSize,
  aspectRatio: number,
  frameScale: number,
  center?: { x: number; y: number }
) {
  const displayRatio = display.width / display.height;
  let maxWidth = display.width;
  let maxHeight = display.height;

  if (displayRatio > aspectRatio) {
    maxWidth = display.height * aspectRatio;
  } else {
    maxHeight = display.width / aspectRatio;
  }

  const width = clamp(maxWidth * frameScale, 1, maxWidth);
  const height = width / aspectRatio;
  const nextCenter = center ?? {
    x: display.width / 2,
    y: display.height / 2,
  };

  return {
    x: clamp(nextCenter.x - width / 2, 0, display.width - width),
    y: clamp(nextCenter.y - height / 2, 0, display.height - height),
    width,
    height,
  };
}

export default function ImageCropModal({
  file,
  aspectRatio,
  title,
  onCancel,
  onConfirm,
}: ImageCropModalProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    box: CropBox;
  } | null>(null);
  const [objectUrl, setObjectUrl] = useState("");
  const [imageSize, setImageSize] = useState<ImageSize | null>(null);
  const [cropBox, setCropBox] = useState<CropBox | null>(null);
  const [frameScale, setFrameScale] = useState(defaultFrameScale);
  const [saving, setSaving] = useState(false);

  const readDisplaySize = useCallback(() => {
    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect?.width || !rect.height) return null;
    return { width: rect.width, height: rect.height };
  }, []);

  const resetCrop = useCallback(
    (scale = frameScale) => {
      const display = readDisplaySize();
      if (!display) return;
      setCropBox(buildCropBox(display, aspectRatio, scale));
    },
    [aspectRatio, frameScale, readDisplaySize]
  );

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    setImageSize(null);
    setCropBox(null);
    setFrameScale(defaultFrameScale);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const handleResize = () => resetCrop();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [resetCrop]);

  const updateFrameScale = (value: number) => {
    const nextScale = clamp(value, minFrameScale, maxFrameScale);
    setFrameScale(nextScale);
    const display = readDisplaySize();
    if (!display) return;

    setCropBox(current => {
      const center = current
        ? {
            x: current.x + current.width / 2,
            y: current.y + current.height / 2,
          }
        : undefined;
      return buildCropBox(display, aspectRatio, nextScale, center);
    });
  };

  const moveCrop = (deltaX: number, deltaY: number, baseBox: CropBox) => {
    const display = readDisplaySize();
    if (!display) return baseBox;
    return {
      ...baseBox,
      x: clamp(baseBox.x + deltaX, 0, display.width - baseBox.width),
      y: clamp(baseBox.y + deltaY, 0, display.height - baseBox.height),
    };
  };

  const confirmCrop = async () => {
    if (!cropBox || !imageSize) return;
    const display = readDisplaySize();
    if (!display) return;

    setSaving(true);
    try {
      await onConfirm({
        x: (cropBox.x / display.width) * imageSize.width,
        y: (cropBox.y / display.height) * imageSize.height,
        width: (cropBox.width / display.width) * imageSize.width,
        height: (cropBox.height / display.height) * imageSize.height,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#1f1d1a]/80 p-3 backdrop-blur-sm">
      <div className="flex max-h-[94vh] w-full max-w-5xl flex-col border border-[#e6ded1] bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-[#e6ded1] px-4 py-3 md:px-5">
          <div>
            <h2 className="text-base font-medium text-[#2e2218]">{title}</h2>
            <p className="mt-1 text-xs text-[#6f6a61]">
              4:5 프레임을 움직여 대표사진 영역을 맞춰 주세요.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-9 w-9 items-center justify-center border border-[#e6ded1] text-[#4f4638] hover:bg-[#faf9f7]"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-[#f5f2ed] p-3 md:p-5">
          <div className="flex min-h-[260px] items-center justify-center">
            <div className="relative inline-block max-w-full select-none">
              {objectUrl && (
                <img
                  ref={imageRef}
                  src={objectUrl}
                  alt="선택한 대표사진"
                  className="block max-h-[58vh] max-w-full"
                  draggable={false}
                  onLoad={event => {
                    setImageSize({
                      width: event.currentTarget.naturalWidth,
                      height: event.currentTarget.naturalHeight,
                    });
                    requestAnimationFrame(() => resetCrop(defaultFrameScale));
                  }}
                />
              )}

              {cropBox && (
                <div
                  className="absolute border-2 border-white shadow-[0_0_0_9999px_rgba(31,29,26,0.55)]"
                  style={{
                    left: cropBox.x,
                    top: cropBox.y,
                    width: cropBox.width,
                    height: cropBox.height,
                    touchAction: "none",
                    cursor: "move",
                  }}
                  onPointerDown={event => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    dragRef.current = {
                      pointerId: event.pointerId,
                      startX: event.clientX,
                      startY: event.clientY,
                      box: cropBox,
                    };
                  }}
                  onPointerMove={event => {
                    const drag = dragRef.current;
                    if (!drag || drag.pointerId !== event.pointerId) return;
                    setCropBox(
                      moveCrop(
                        event.clientX - drag.startX,
                        event.clientY - drag.startY,
                        drag.box
                      )
                    );
                  }}
                  onPointerUp={event => {
                    if (dragRef.current?.pointerId === event.pointerId) {
                      dragRef.current = null;
                    }
                  }}
                  onPointerCancel={() => {
                    dragRef.current = null;
                  }}
                >
                  <span className="absolute left-1/3 top-0 h-full w-px bg-white/45" />
                  <span className="absolute left-2/3 top-0 h-full w-px bg-white/45" />
                  <span className="absolute left-0 top-1/3 h-px w-full bg-white/45" />
                  <span className="absolute left-0 top-2/3 h-px w-full bg-white/45" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-t border-[#e6ded1] px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:px-5">
          <label className="grid gap-2 text-xs text-[#6f6a61]">
            <span>프레임 크기</span>
            <div className="flex items-center gap-3">
              <Minus className="h-4 w-4" />
              <input
                type="range"
                min={minFrameScale}
                max={maxFrameScale}
                step={0.01}
                value={frameScale}
                onChange={event => updateFrameScale(Number(event.target.value))}
                className="w-full accent-[#1f1d1a]"
              />
              <Plus className="h-4 w-4" />
            </div>
          </label>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onCancel}
              className="h-11 border border-[#e6ded1] px-5 text-sm text-[#4f4638] hover:bg-[#faf9f7]"
            >
              취소
            </button>
            <button
              type="button"
              onClick={confirmCrop}
              disabled={!cropBox || saving}
              className="inline-flex h-11 items-center justify-center gap-2 bg-[#1f1d1a] px-5 text-sm font-medium text-white hover:bg-[#33302b] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              {saving ? "저장 중" : "적용"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
