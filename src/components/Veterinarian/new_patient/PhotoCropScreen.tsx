'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, Minus, Plus } from 'lucide-react';

interface PhotoCropScreenProps {
  imageUrl: string;
  onConfirm: (croppedBlob: Blob) => void;
  onCancel: () => void;
  onChangeImage: () => void;
  uploading?: boolean;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 4;

export default function PhotoCropScreen({
  imageUrl,
  onConfirm,
  onCancel,
  onChangeImage,
  uploading = false,
}: PhotoCropScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // offset is the translation of the image centre relative to the circle centre
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [circleDiameter, setCircleDiameter] = useState(280);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Touch / pointer state
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const lastPinchDist = useRef<number | null>(null);

  // Load image
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Compute circle size based on screen width
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setCircleDiameter(Math.min(w - 48, 320));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Fit image to circle on first load
  useEffect(() => {
    if (!imgLoaded || !imgRef.current) return;
    const img = imgRef.current;
    const r = circleDiameter / 2;
    const fitScale = Math.max(
      circleDiameter / img.naturalWidth,
      circleDiameter / img.naturalHeight
    );
    setScale(fitScale);
    setOffset({ x: 0, y: 0 });
  }, [imgLoaded, circleDiameter]);

  // Draw frame
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imgLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const r = circleDiameter / 2;
    const cx = W / 2;
    const cy = H / 2;

    ctx.clearRect(0, 0, W, H);

    // --- Background: blurred full image ---
    ctx.save();
    ctx.filter = 'blur(12px) brightness(0.55)';
    const bgs = Math.max(W / img.naturalWidth, H / img.naturalHeight) * 1.15;
    const bw = img.naturalWidth * bgs;
    const bh = img.naturalHeight * bgs;
    ctx.drawImage(img, cx - bw / 2, cy - bh / 2, bw, bh);
    ctx.filter = 'none';
    ctx.restore();

    // --- Clip circle and draw image with pan/zoom ---
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx + offset.x, cy + offset.y, r, 0, Math.PI * 2);
    ctx.clip();

    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    ctx.drawImage(
      img,
      cx - drawW / 2 + offset.x,
      cy - drawH / 2 + offset.y,
      drawW,
      drawH
    );
    ctx.restore();

    // --- Circle border ---
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    // --- 4 dot handles ---
    const dotR = 5;
    const dots = [
      { x: cx, y: cy - r },
      { x: cx, y: cy + r },
      { x: cx - r, y: cy },
      { x: cx + r, y: cy },
    ];
    dots.forEach(({ x, y }) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, dotR, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.restore();
    });
  }, [imgLoaded, scale, offset, circleDiameter]);

  useEffect(() => {
    draw();
  }, [draw]);

  // ---- Pointer / Touch event handlers ----
  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement> | PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    lastPointer.current = getCanvasPoint(e);
    (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;
    const cur = getCanvasPoint(e);
    const dx = cur.x - lastPointer.current.x;
    const dy = cur.y - lastPointer.current.y;
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    lastPointer.current = cur;
  };

  const onPointerUp = () => {
    isDragging.current = false;
    lastPinchDist.current = null;
  };

  // Touch pinch zoom
  const onTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy);
    }
  };

  const onTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2 && lastPinchDist.current !== null) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const delta = dist / lastPinchDist.current;
      setScale((prev) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev * delta)));
      lastPinchDist.current = dist;
    }
  };

  // Slider: 0–100 maps to MIN_SCALE–MAX_SCALE
  const sliderValue = Math.round(
    ((scale - MIN_SCALE) / (MAX_SCALE - MIN_SCALE)) * 100
  );

  const onSliderChange = (val: number) => {
    const newScale = MIN_SCALE + (val / 100) * (MAX_SCALE - MIN_SCALE);
    setScale(Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale)));
  };

  const zoomIn = () => setScale((s) => Math.min(MAX_SCALE, s + 0.15));
  const zoomOut = () => setScale((s) => Math.max(MIN_SCALE, s - 0.15));

  // Produce cropped circular image
  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img || !imgLoaded) return;

    const outputSize = 400;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = outputSize;
    offCanvas.height = outputSize;
    const ctx = offCanvas.getContext('2d')!;

    const r = outputSize / 2;
    ctx.beginPath();
    ctx.arc(r, r, r, 0, Math.PI * 2);
    ctx.clip();

    // The main canvas dimensions
    const mainCanvas = canvasRef.current!;
    const W = mainCanvas.width;
    const H = mainCanvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const circleR = circleDiameter / 2;

    // source region on main canvas = circle bounding box
    const srcX = cx - circleR;
    const srcY = cy - circleR;
    const srcW = circleDiameter;
    const srcH = circleDiameter;

    // We need to re-render the image portion that's inside the circle
    // onto the offCanvas at full resolution
    const scaleToOutput = outputSize / circleDiameter;
    const drawW = img.naturalWidth * scale * scaleToOutput;
    const drawH = img.naturalHeight * scale * scaleToOutput;
    const imgCx = (outputSize / 2) + offset.x * scaleToOutput;
    const imgCy = (outputSize / 2) + offset.y * scaleToOutput;

    ctx.drawImage(img, imgCx - drawW / 2, imgCy - drawH / 2, drawW, drawH);

    offCanvas.toBlob(
      (blob) => {
        if (blob) onConfirm(blob);
      },
      'image/jpeg',
      0.9
    );
  };

  // Resize canvas to fill screen
  const [canvasDims, setCanvasDims] = useState({ w: 390, h: 844 });
  useEffect(() => {
    const update = () => {
      setCanvasDims({ w: window.innerWidth, h: window.innerHeight });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black" style={{ touchAction: 'none' }}>
      {/* Canvas fills entire screen */}
      <canvas
        ref={canvasRef}
        width={canvasDims.w}
        height={canvasDims.h}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-4 pt-14 pb-2">
        <button
          onClick={onCancel}
          className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <span className="text-white text-[17px] font-semibold">Ajustar foto</span>
      </div>

      {/* Spacer to push bottom controls down */}
      <div className="flex-1" />

      {/* Bottom controls */}
      <div className="relative z-10 px-5 pb-10 space-y-4" style={{ pointerEvents: 'none' }}>
        {/* Instructions */}
        <div className="text-center" style={{ pointerEvents: 'none' }}>
          <p className="text-white font-bold text-[14px] leading-snug">
            Arraste para mover · pinça para ampliar
          </p>
          <p className="text-white/70 text-[12px] mt-0.5">
            A área dentro do círculo será o perfil do pet.
          </p>
        </div>

        {/* Zoom Slider */}
        <div className="flex items-center gap-3" style={{ pointerEvents: 'all' }}>
          <button
            onClick={zoomOut}
            className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0"
          >
            <Minus className="w-4 h-4 text-white" />
          </button>
          <div className="flex-1 relative h-1.5">
            <div className="absolute inset-0 rounded-full bg-white/30" />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white/70"
              style={{ width: `${sliderValue}%` }}
            />
            <input
              type="range"
              min={0}
              max={100}
              value={sliderValue}
              onChange={(e) => onSliderChange(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
            />
            {/* Dot thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary shadow-lg border-2 border-white"
              style={{ left: `calc(${sliderValue}% - 8px)` }}
            />
          </div>
          <button
            onClick={zoomIn}
            className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3" style={{ pointerEvents: 'all' }}>
          <button
            onClick={handleConfirm}
            disabled={uploading || !imgLoaded}
            className="bg-primary text-white font-bold text-[15px] py-[15px] rounded-2xl disabled:opacity-60 transition-colors"
          >
            {uploading ? 'Enviando...' : 'Concluir'}
          </button>
          <button
            onClick={onChangeImage}
            disabled={uploading}
            className="bg-white/10 backdrop-blur-sm text-white font-bold text-[15px] py-[15px] rounded-2xl border border-white/40 disabled:opacity-60 transition-colors"
          >
            Alterar imagem
          </button>
        </div>
      </div>
    </div>
  );
}
