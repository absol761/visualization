import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useParticleBackground } from "./useParticleBackground";
import "./AuthPage.css";

export default function DeviceSelection({ onSelect }) {
  const [isDark, setIsDark] = useState(false);
  const [mouse, setMouse] = useState({ x: -500, y: -500 });
  const cardRef = useRef(null);
  const navigate = useNavigate();
  const canvasRef = useParticleBackground(isDark, mouse);

  const sunPath =
    "M12,7c-2.8,0-5,2.2-5,5s2.2,5,5,5s5-2.2,5-5S14.8,7,12,7z M12,15c-1.7,0-3-1.3-3-3s1.3-3,3-3s3,1.3,3,3 S13.7,15,12,15z M11,1h2v3h-2V1z M11,20h2v3h-2V20z M23,11v2h-3v-2H23z M4,11v2H1v-2H4z M18.4,4.2l1.4,1.4l-2.1,2.1L16.3,6.3L18.4,4.2z M5.6,17l1.4,1.4l-2.1,2.1L3.5,19.1L5.6,17z M18.4,19.8l-2.1-2.1l1.4-1.4l2.1,2.1L18.4,19.8z M5.6,7L3.5,4.9l1.4-1.4L7,5.6L5.6,7z";
  const moonPath =
    "M12.1,22c-4.8,0-9-3.6-9.8-8.4c-0.1-0.4,0.1-0.8,0.5-1c0.4-0.1,0.8,0,1,0.4c1.1,1.9,3.1,3,5.3,3c3.3,0,6-2.7,6-6 c0-2.2-1.1-4.2-3-5.3c-0.3-0.2-0.5-0.6-0.4-1c0.1-0.4,0.4-0.7,0.8-0.7c0.2,0,0.4,0,0.6,0.1c4.8,0.8,8.4,5,8.4,9.8 C21.6,17.5,17.3,22,12.1,22z";

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
    if (isDark) {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }
  }, [isDark]);

  const handleDeviceSelect = (deviceType) => {
    localStorage.setItem("deviceType", deviceType);
    onSelect(deviceType);
  };

  return (
    <div className={`auth-page-container ${isDark ? "dark-theme" : ""}`}>
      <button
        id="auth-theme-btn"
        onClick={toggleTheme}
        title="Toggle Theme"
        aria-label="Toggle theme"
      >
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
          <path d={isDark ? sunPath : moonPath} />
        </svg>
      </button>

      <canvas ref={canvasRef} id="auth-canvas" />

      <div className="auth-card-perspective-wrapper">
        <div className="auth-glass-card" ref={cardRef}>
          <div className="auth-header">
            <h2 className="auth-heading">Choose Your Device</h2>
            <p className="auth-subheading">Select the experience that matches your device</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "30px" }}>
            <button
              onClick={() => handleDeviceSelect("desktop")}
              className="auth-submit-btn"
              style={{ 
                width: "100%", 
                padding: "20px",
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px"
              }}
            >
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h3l-1 1v1h12v-1l-1-1h3c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13H4V5h16v11z"/>
              </svg>
              Computer / Desktop
            </button>

            <button
              onClick={() => handleDeviceSelect("mobile")}
              className="auth-submit-btn"
              style={{ 
                width: "100%", 
                padding: "20px",
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px"
              }}
            >
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/>
              </svg>
              Mobile Device
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

