import { useEffect, useRef } from "react";

interface Point {
  x: number;
  y: number;
  radius: number;
  pulseSpeed: number;
  pulsePhase: number;
  opacity: number;
  verified: boolean;
}

interface Connection {
  from: number;
  to: number;
  progress: number;
  speed: number;
  opacity: number;
}

export default function MapBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let points: Point[] = [];
    let connections: Connection[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initPoints();
    };

    const initPoints = () => {
      const count = Math.floor((canvas.width * canvas.height) / 25000);
      points = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 1,
        pulseSpeed: Math.random() * 0.02 + 0.005,
        pulsePhase: Math.random() * Math.PI * 2,
        opacity: Math.random() * 0.5 + 0.2,
        verified: Math.random() > 0.6,
      }));

      // Create connections between nearby points
      connections = [];
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180 && Math.random() > 0.6) {
            connections.push({
              from: i,
              to: j,
              progress: Math.random(),
              speed: Math.random() * 0.003 + 0.001,
              opacity: Math.random() * 0.15 + 0.05,
            });
          }
        }
      }
    };

    const drawGrid = (time: number) => {
      const spacing = 80;
      ctx.strokeStyle = "rgba(0, 125, 255, 0.03)";
      ctx.lineWidth = 0.5;

      // Horizontal lines
      for (let y = 0; y < canvas.height; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Vertical lines
      for (let x = 0; x < canvas.width; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Subtle crosshairs at intersections (sparse)
      ctx.strokeStyle = "rgba(0, 125, 255, 0.06)";
      for (let x = 0; x < canvas.width; x += spacing * 3) {
        for (let y = 0; y < canvas.height; y += spacing * 3) {
          const size = 4;
          ctx.beginPath();
          ctx.moveTo(x - size, y);
          ctx.lineTo(x + size, y);
          ctx.moveTo(x, y - size);
          ctx.lineTo(x, y + size);
          ctx.stroke();
        }
      }
    };

    const drawConnections = (time: number) => {
      for (const conn of connections) {
        const from = points[conn.from];
        const to = points[conn.to];

        // Static line
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = `rgba(0, 125, 255, ${conn.opacity})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Traveling dot
        conn.progress += conn.speed;
        if (conn.progress > 1) conn.progress = 0;

        const tx = from.x + (to.x - from.x) * conn.progress;
        const ty = from.y + (to.y - from.y) * conn.progress;

        ctx.beginPath();
        ctx.arc(tx, ty, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 125, 255, ${conn.opacity * 3})`;
        ctx.fill();
      }
    };

    const drawPoints = (time: number) => {
      for (const p of points) {
        const pulse = Math.sin(time * p.pulseSpeed + p.pulsePhase);
        const currentRadius = p.radius + pulse * 0.5;
        const currentOpacity = p.opacity + pulse * 0.15;

        // Outer glow
        if (p.verified) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, currentRadius * 4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(39, 190, 105, ${currentOpacity * 0.1})`;
          ctx.fill();
        }

        // POI ring
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentRadius * 2, 0, Math.PI * 2);
        ctx.strokeStyle = p.verified
          ? `rgba(39, 190, 105, ${currentOpacity * 0.3})`
          : `rgba(0, 125, 255, ${currentOpacity * 0.2})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Center dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = p.verified
          ? `rgba(39, 190, 105, ${currentOpacity})`
          : `rgba(87, 170, 255, ${currentOpacity})`;
        ctx.fill();
      }
    };

    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGrid(time);
      drawConnections(time);
      drawPoints(time);
      animId = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener("resize", resize);
    animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ opacity: 0.7 }}
    />
  );
}
