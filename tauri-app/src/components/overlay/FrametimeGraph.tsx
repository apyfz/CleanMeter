import { useRef, useEffect } from "react";

interface FrametimeGraphProps {
  history: number[];
  width: number;
  height: number;
}

export function FrametimeGraph({ history, width, height }: FrametimeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef({ w: 0, h: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || history.length < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const targetW = width * dpr;
    const targetH = height * dpr;

    if (sizeRef.current.w !== targetW || sizeRef.current.h !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
      sizeRef.current = { w: targetW, h: targetH };
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const maxVal = Math.max(...history, 1);
    const stepX = width / (history.length - 1);

    ctx.strokeStyle = getComputedStyle(canvas).getPropertyValue("--overlay-text").trim() || "white";
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    ctx.beginPath();
    history.forEach((val, i) => {
      const x = i * stepX;
      const y = height - (val / maxVal) * (height - 4) - 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [history, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="opacity-80"
    />
  );
}
