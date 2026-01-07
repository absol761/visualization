import { useState, useEffect, useRef } from "react";
import { useAuth } from "./CustomAuthContext";
import { useNavigate, Link } from "react-router-dom";
import PrivacyModal from "./PrivacyModal";
import InstagramIcon from "./InstagramIcon";
import { useParticleBackground } from "./useParticleBackground";
import DeviceSelection from "./DeviceSelection";
import "./AuthPage.css";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [mouse, setMouse] = useState({ x: -500, y: -500 });
  const [showDeviceSelection, setShowDeviceSelection] = useState(false);
  const cardRef = useRef(null);
  const { signup, loading } = useAuth();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!privacyAccepted) {
      setError("Please accept the Privacy Policy to continue");
      return;
    }

    const u = await signup(username.trim(), password);
    if (!u) setError("Username already taken");
    else {
      // Check if device type is already set
      const deviceType = localStorage.getItem("deviceType");
      if (deviceType) {
        navigate(deviceType === "mobile" ? "/notes-mobile" : "/notes");
      } else {
        setShowDeviceSelection(true);
      }
    }
  };

  const handleDeviceSelect = (deviceType) => {
    navigate(deviceType === "mobile" ? "/notes-mobile" : "/notes");
  };

  if (showDeviceSelection) {
    return <DeviceSelection onSelect={handleDeviceSelect} />;
  }

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
            <h2 className="auth-heading">Create Account</h2>
            <p className="auth-subheading">Start mapping your ideas</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-input-group">
              <label className="auth-label">Username</label>
              <input
                type="text"
                autoFocus
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setUsernameFocused(true)}
                onBlur={() => setUsernameFocused(false)}
                required
                maxLength={40}
                className="auth-input"
                spellCheck={false}
              />
            </div>

            <div className="auth-input-group">
              <label className="auth-label">Password</label>
              <input
                type="password"
                placeholder="Create a secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                required
                className="auth-input"
              />
            </div>

            <div className="auth-checkbox-group">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="auth-checkbox"
                />
                <span className="auth-checkbox-text">
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={() => setShowPrivacyPolicy(true)}
                    className="auth-privacy-link"
                  >
                    Privacy Policy
                  </button>
                </span>
              </label>
            </div>

            {error && (
              <div className="auth-error-box">
                <span className="auth-error-icon">⚠</span>
                <span className="auth-error-text">{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading || !privacyAccepted}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>

            <div className="auth-divider">
              <span className="auth-divider-text">or</span>
            </div>

            <div className="auth-link-section">
              <span className="auth-link-text">Already have an account?</span>
              <Link to="/login" className="auth-link">
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>

      <PrivacyModal
        isOpen={showPrivacyPolicy}
        onClose={() => setShowPrivacyPolicy(false)}
      />

      <footer className="auth-footer">
        DEVELOPED BY ILAN BARTS
        <a
          href="https://www.instagram.com/ilanbarts"
          className="auth-insta-link"
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
