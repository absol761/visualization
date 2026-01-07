import { useEffect, useRef } from "react";

export function useParticleBackground(isDark, mouse) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationFrameRef = useRef(null);
  const isDarkRef = useRef(isDark);
  const mouseRef = useRef(mouse);

  useEffect(() => {
    isDarkRef.current = isDark;
  }, [isDark]);

  useEffect(() => {
    mouseRef.current = mouse;
  }, [mouse]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    function init() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particlesRef.current = [];
      for (let i = 0; i < 75; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          size: Math.random() * 2,
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const currentIsDark = isDarkRef.current;
      const currentMouse = mouseRef.current;
      const particleColor = currentIsDark
        ? "rgba(255,255,255,0.4)"
        : "rgba(0,0,0,0.2)";
      const lineColorBase = currentIsDark ? "255,255,255" : "0,0,0";
      const lineOpacityLimit = currentIsDark ? 0.15 : 0.08;

      particlesRef.current.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        let dxm = currentMouse.x - p.x;
        let dym = currentMouse.y - p.y;
        let distM = Math.sqrt(dxm * dxm + dym * dym);
        if (distM < 180) {
          let force = (180 - distM) / 180;
          p.x -= (dxm / distM) * force * 1.5;
          p.y -= (dym / distM) * force * 1.5;
        }
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.fillStyle = particleColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          let p2 = particlesRef.current[j];
          let dx = p.x - p2.x;
          let dy = p.y - p2.y;
          let d = Math.sqrt(dx * dx + dy * dy);
          if (d < 150) {
            ctx.strokeStyle = `rgba(${lineColorBase}, ${(1 - d / 150) * lineOpacityLimit})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });
      animationFrameRef.current = requestAnimationFrame(draw);
    }

    init();
    draw();

    const handleResize = () => {
      init();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return canvasRef;
}

