import { useEffect, useRef } from "react";

export default function ConstellationBackground() {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let dpr = window.devicePixelRatio || 1;
    let width = window.innerWidth, height = window.innerHeight;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1,0,0,1,0,0);
      ctx.scale(dpr, dpr);
    }
    resize();
    window.addEventListener('resize', resize);

    // PLEXUS EFFECT - light gray background
    const NODE_AMOUNT = 60;
    const NODE_BASE_RADIUS = 2;
    const SPEED = 0.15;
    const MAX_DISTANCE = 150;
    const LINE_COLOR = "#4a90e2"; // Blue for plexus lines
    const NODE_COLOR = "#5ba3f5"; // Blue for nodes
    
    let nodes = new Array(NODE_AMOUNT).fill().map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: SPEED * (Math.random() - 0.5),
      vy: SPEED * (Math.random() - 0.5),
      radius: NODE_BASE_RADIUS + 1.5 * Math.random(),
    }));

    let animationId;
    function animate() {
      ctx.clearRect(0, 0, width, height);
      // fill light gray BG
      ctx.fillStyle = "#e5e5e5";
      ctx.fillRect(0, 0, width, height);
      
      // Draw lines between close nodes (Plexus effect)
      ctx.globalAlpha = 1.0;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i+1; j < nodes.length; j++) {
          let a = nodes[i], b = nodes[j];
          let d = Math.hypot(a.x-b.x, a.y-b.y);
          if (d < MAX_DISTANCE) {
            let opacity = 1 - (d / MAX_DISTANCE);
            let lineWidth = (1.5 - d/MAX_DISTANCE) * 1.2;
            
            // Create gradient for line
            let gradient = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            gradient.addColorStop(0, `rgba(75, 144, 226, ${opacity * 0.4})`);
            gradient.addColorStop(0.5, `rgba(91, 163, 245, ${opacity * 0.5})`);
            gradient.addColorStop(1, `rgba(75, 144, 226, ${opacity * 0.4})`);
            
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = lineWidth;
            ctx.shadowColor = "rgba(75, 144, 226, 0.5)";
            ctx.shadowBlur = 3;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        }
      }
      
      // Draw nodes with glow effect
      for (let i = 0; i < nodes.length; i++) {
        let n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;

        // Outer glow
        let gradient = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius * 3);
        gradient.addColorStop(0, "rgba(91, 163, 245, 0.6)");
        gradient.addColorStop(0.5, "rgba(75, 144, 226, 0.3)");
        gradient.addColorStop(1, "rgba(75, 144, 226, 0)");
        
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Node core
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = NODE_COLOR;
        ctx.shadowColor = "rgba(75, 144, 226, 0.8)";
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      
      animationId = requestAnimationFrame(animate);
    }
    animate();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} style={{
    position:'fixed', left:0, top:0, width:'100vw', height:'100vh', zIndex:0, background:'#e5e5e5'
  }} />;
}
