import { useEffect, useRef } from "react";

export function GargantuaBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let engine: { start: () => void; dispose: () => void } | null = null;
    const boot = window.setTimeout(() => {
      import("@/lib/gargantua/engine")
        .then(({ GargantuaEngine }) => {
          if (disposed || !canvasRef.current) return;
          engine = new GargantuaEngine(canvasRef.current);
          engine.start();
        })
        .catch(() => {
          /* WebGL unavailable — CSS fallback remains */
        });
    }, 700);

    return () => {
      disposed = true;
      window.clearTimeout(boot);
      engine?.dispose();
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-void" aria-hidden="true">
      <div className="bh-fallback" />
      <canvas
        ref={canvasRef}
        className="bh-canvas absolute inset-0 block h-full w-full"
        aria-hidden="true"
      />
      <div className="bh-scanlines" />
    </div>
  );
}
