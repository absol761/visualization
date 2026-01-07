import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import InstagramIcon from "./InstagramIcon";
import "./Landing.css";

export default function Landing() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const cardRef = useRef(null);
  const [isDark, setIsDark] = useState(false);
  const [mouse, setMouse] = useState({ x: -500, y: -500 });
  const particlesRef = useRef([]);
  const animationFrameRef = useRef(null);
  const isDarkRef = useRef(isDark);
  const mouseRef = useRef(mouse);

  const sunPath = "M12,7c-2.8,0-5,2.2-5,5s2.2,5,5,5s5-2.2,5-5S14.8,7,12,7z M12,15c-1.7,0-3-1.3-3-3s1.3-3,3-3s3,1.3,3,3 S13.7,15,12,15z M11,1h2v3h-2V1z M11,20h2v3h-2V20z M23,11v2h-3v-2H23z M4,11v2H1v-2H4z M18.4,4.2l1.4,1.4l-2.1,2.1L16.3,6.3L18.4,4.2z M5.6,17l1.4,1.4l-2.1,2.1L3.5,19.1L5.6,17z M18.4,19.8l-2.1-2.1l1.4-1.4l2.1,2.1L18.4,19.8z M5.6,7L3.5,4.9l1.4-1.4L7,5.6L5.6,7z";
  const moonPath = "M12.1,22c-4.8,0-9-3.6-9.8-8.4c-0.1-0.4,0.1-0.8,0.5-1c0.4-0.1,0.8,0,1,0.4c1.1,1.9,3.1,3,5.3,3c3.3,0,6-2.7,6-6 c0-2.2-1.1-4.2-3-5.3c-0.3-0.2-0.5-0.6-0.4-1c0.1-0.4,0.4-0.7,0.8-0.7c0.2,0,0.4,0,0.6,0.1c4.8,0.8,8.4,5,8.4,9.8 C21.6,17.5,17.3,22,12.1,22z";

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
      const particleColor = currentIsDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.2)";
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

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMouse({ x: e.x, y: e.y });
      if (cardRef.current) {
        const xAxis = (window.innerWidth / 2 - e.pageX) / 25;
        const yAxis = (window.innerHeight / 2 - e.pageY) / 25;
        cardRef.current.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
      }
    };

    const handleMouseLeave = () => {
      if (cardRef.current) {
        cardRef.current.style.transform = `rotateY(0deg) rotateX(0deg)`;
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  useEffect(() => {
    isDarkRef.current = isDark;
    if (isDark) {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }
  }, [isDark]);

  useEffect(() => {
    mouseRef.current = mouse;
  }, [mouse]);

  return (
    <div className={`landing-container ${isDark ? "dark-theme" : ""}`}>
      <button
        id="theme-btn"
        onClick={toggleTheme}
        title="Toggle Theme"
        aria-label="Toggle theme"
      >
        <svg id="theme-icon" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
          <path d={isDark ? sunPath : moonPath} />
        </svg>
      </button>

      <canvas ref={canvasRef} id="canvas" />

      <div className="card-perspective-wrapper">
        <div className="glass-card" id="card" ref={cardRef}>
          <h1>mind map.</h1>
          <p className="subtext">The spatial interface for deep thought.</p>
          <div className="cta-group">
            <button
              className="btn btn-signup"
              onClick={() => navigate("/signup")}
            >
              Get Started
            </button>
            <button
              className="btn btn-signin"
              onClick={() => navigate("/login")}
            >
              Sign In
            </button>
          </div>
        </div>
      </div>

      <footer>
        DEVELOPED BY ILAN BARTS
        <a
          href="https://www.instagram.com/ilanbarts"
          className="insta-link"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit Ilan Barts on Instagram"
        >
          <InstagramIcon size={14} color="currentColor" />
        </a>
      </footer>
    </div>
  );
}
