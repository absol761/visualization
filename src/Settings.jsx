import { useState, useEffect } from "react";
import { collection, doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

export default function Settings({ isOpen, onClose, user }) {
  const [settings, setSettings] = useState({
    theme: "gemini",
    fontSize: "14",
    fontFamily: "Inter",
    cardStyle: "glass",
    particleDensity: "75",
    animationSpeed: "normal",
    showGrid: true,
    gridSize: "20",
    edgeStyle: "smooth",
    nodeShadow: true,
    colorScheme: "auto",
    typingSounds: false,
    typingSoundType: "gateron-ks-3-milky-yellow-pro",
    typingSoundVolume: 0.3,
  });

  const settingsCol = user ? collection(db, "users", user.id, "settings") : null;

  // Apply settings to the app
  const applySettings = (newSettings) => {
    const root = document.documentElement;
    
    // Apply theme
    document.body.className = document.body.className.replace(/theme-\w+/g, "");
    document.body.classList.add(`theme-${newSettings.theme}`);
    
    // Apply CSS variables based on theme
    const theme = themes[newSettings.theme] || themes.gemini;
    root.style.setProperty("--primary-color", theme.primary);
    root.style.setProperty("--secondary-color", theme.secondary);
    root.style.setProperty("--accent-color", theme.accent);
    root.style.setProperty("--bg-color", theme.bg);
    root.style.setProperty("--card-bg", theme.cardBg);
    root.style.setProperty("--text-color", theme.text);
    root.style.setProperty("--border-color", theme.border);
    
    // Apply font
    root.style.setProperty("--font-family", newSettings.fontFamily);
    root.style.setProperty("--font-size", `${newSettings.fontSize}px`);
    
    // Apply other settings
    root.style.setProperty("--particle-density", newSettings.particleDensity);
    root.style.setProperty("--animation-speed", newSettings.animationSpeed);
    root.style.setProperty("--grid-size", `${newSettings.gridSize}px`);
    
    // Store in localStorage for immediate access
    localStorage.setItem("appSettings", JSON.stringify(newSettings));
  };

  // Load settings
  useEffect(() => {
    if (!settingsCol) {
      // Apply default settings if no user
      applySettings(settings);
      return;
    }
    const unsubscribe = onSnapshot(doc(settingsCol, "userSettings"), (docSnap) => {
      if (docSnap.exists()) {
        const loadedSettings = docSnap.data();
        setSettings(loadedSettings);
        applySettings(loadedSettings);
      } else {
        applySettings(settings);
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsCol]);

  const saveSettings = async (newSettings) => {
    setSettings(newSettings);
    applySettings(newSettings);
    if (settingsCol) {
      await setDoc(doc(settingsCol, "userSettings"), newSettings);
    }
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: newSettings }));
  };

  if (!isOpen) return null;

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={header}>
          <h2 style={title}>⚙️ Settings</h2>
          <button style={closeBtn} onClick={onClose}>×</button>
        </div>
        
        <div style={content}>
          {/* Theme Selection */}
          <section style={section}>
            <h3 style={sectionTitle}>Theme</h3>
            <div style={themeGrid}>
              {Object.entries(themes).map(([key, theme]) => (
                <div
                  key={key}
                  onClick={() => saveSettings({ ...settings, theme: key })}
                  style={{
                    ...themeCard,
                    border: settings.theme === key ? `3px solid ${theme.primary}` : "2px solid var(--border-color)",
                    backgroundColor: settings.theme === key ? theme.cardBg : "var(--card-bg)",
                  }}
                >
                  <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <div style={{ width: "20px", height: "20px", borderRadius: "4px", backgroundColor: theme.primary }} />
                    <div style={{ width: "20px", height: "20px", borderRadius: "4px", backgroundColor: theme.secondary }} />
                    <div style={{ width: "20px", height: "20px", borderRadius: "4px", backgroundColor: theme.accent }} />
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-color)" }}>
                    {theme.name}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-color)", opacity: 0.7 }}>
                    {theme.description}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Typography */}
          <section style={section}>
            <h3 style={sectionTitle}>Typography</h3>
            <div style={settingRow}>
              <label style={label}>Font Family</label>
              <select
                value={settings.fontFamily}
                onChange={(e) => saveSettings({ ...settings, fontFamily: e.target.value })}
                style={select}
              >
                <option value="Inter">Inter</option>
                <option value="System UI">System UI</option>
                <option value="Georgia">Georgia</option>
                <option value="Monaco">Monaco</option>
                <option value="Roboto">Roboto</option>
                <option value="Open Sans">Open Sans</option>
              </select>
            </div>
            <div style={settingRow}>
              <label style={label}>Font Size: {settings.fontSize}px</label>
              <input
                type="range"
                min="12"
                max="20"
                value={settings.fontSize}
                onChange={(e) => saveSettings({ ...settings, fontSize: e.target.value })}
                style={slider}
              />
            </div>
          </section>

          {/* Visual Settings */}
          <section style={section}>
            <h3 style={sectionTitle}>Visual Settings</h3>
            <div style={settingRow}>
              <label style={label}>Card Style</label>
              <select
                value={settings.cardStyle}
                onChange={(e) => saveSettings({ ...settings, cardStyle: e.target.value })}
                style={select}
              >
                <option value="glass">Glass</option>
                <option value="solid">Solid</option>
                <option value="minimal">Minimal</option>
              </select>
            </div>
            <div style={settingRow}>
              <label style={checkboxLabel}>
                <input
                  type="checkbox"
                  checked={settings.nodeShadow}
                  onChange={(e) => saveSettings({ ...settings, nodeShadow: e.target.checked })}
                  style={checkbox}
                />
                Node Shadows
              </label>
            </div>
            <div style={settingRow}>
              <label style={checkboxLabel}>
                <input
                  type="checkbox"
                  checked={settings.showGrid}
                  onChange={(e) => saveSettings({ ...settings, showGrid: e.target.checked })}
                  style={checkbox}
                />
                Show Grid
              </label>
            </div>
            {settings.showGrid && (
              <div style={settingRow}>
                <label style={label}>Grid Size: {settings.gridSize}px</label>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={settings.gridSize}
                  onChange={(e) => saveSettings({ ...settings, gridSize: e.target.value })}
                  style={slider}
                />
              </div>
            )}
          </section>

          {/* Animation Settings */}
          <section style={section}>
            <h3 style={sectionTitle}>Animation</h3>
            <div style={settingRow}>
              <label style={label}>Particle Density: {settings.particleDensity}</label>
              <input
                type="range"
                min="25"
                max="150"
                value={settings.particleDensity}
                onChange={(e) => saveSettings({ ...settings, particleDensity: e.target.value })}
                style={slider}
              />
            </div>
            <div style={settingRow}>
              <label style={label}>Animation Speed</label>
              <select
                value={settings.animationSpeed}
                onChange={(e) => saveSettings({ ...settings, animationSpeed: e.target.value })}
                style={select}
              >
                <option value="slow">Slow</option>
                <option value="normal">Normal</option>
                <option value="fast">Fast</option>
              </select>
            </div>
          </section>

          {/* Edge Settings */}
          <section style={section}>
            <h3 style={sectionTitle}>Connections</h3>
            <div style={settingRow}>
              <label style={label}>Edge Style</label>
              <select
                value={settings.edgeStyle}
                onChange={(e) => saveSettings({ ...settings, edgeStyle: e.target.value })}
                style={select}
              >
                <option value="smooth">Smooth</option>
                <option value="straight">Straight</option>
                <option value="step">Step</option>
              </select>
            </div>
          </section>

          {/* Typing Sounds */}
          <section style={section}>
            <h3 style={sectionTitle}>Typing Sounds 🎹</h3>
            <div style={settingRow}>
              <label style={checkboxLabel}>
                <input
                  type="checkbox"
                  checked={settings.typingSounds}
                  onChange={(e) => saveSettings({ ...settings, typingSounds: e.target.checked })}
                  style={checkbox}
                />
                Enable typing sounds (Cherry MX switches)
              </label>
            </div>
            {settings.typingSounds && (
              <>
                <div style={settingRow}>
                  <label style={label}>Switch Type</label>
                  <select
                    value={settings.typingSoundType}
                    onChange={(e) => saveSettings({ ...settings, typingSoundType: e.target.value })}
                    style={select}
                  >
                    <option value="gateron-ks-3-milky-yellow-pro">🟡 Gateron KS-3 Milky Yellow Pro (Linear)</option>
                    <option value="cherry-mx2a-black">⚫ Cherry MX2A Black (Linear & Heavy)</option>
                    <option value="roller-switches">🎲 Roller Switches</option>
                    <option value="hmx-switches">🔷 HMX Switches (Linear)</option>
                    <option value="akko-purple">🟣 Akko Purple (Tactile)</option>
                    <option value="juggle-v2">🎪 Juggle v2 (Tactile)</option>
                    <option value="nimbus-v3">☁️ Nimbus v3 (Linear)</option>
                    <option value="graywood-v3">🌲 Graywood v3 (Tactile)</option>
                    <option value="baby-kangaroo">🦘 Baby Kangaroo (Tactile)</option>
                    <option value="baby-raccoon">🦝 Baby Raccoon (Tactile)</option>
                    <option value="gateron-luciola">✨ Gateron Luciola (Linear)</option>
                    <option value="gateron-beer-9-novelkeys-creamy">🍺 Gateron Beer 9: Novelkeys Creamy (Linear)</option>
                    <option value="ws-morandi">🎨 WS Morandi (Linear)</option>
                    <option value="vertex-v1">🔺 Vertex V1 (Tactile)</option>
                    <option value="crystal-ice">❄️ Crystal Ice (Linear)</option>
                    <option value="ink-black">🖤 Ink Black (Linear)</option>
                    <option value="alpacas">🦙 Alpacas (Linear)</option>
                    <option value="holy-boba-u4t">🍡 Holy Boba U4T (Tactile & Thocky)</option>
                    <option value="durock-linear">🔵 Durock Linear</option>
                    <option value="nuphy-mint">🌿 Nuphy Mint (Linear)</option>
                    <option value="akko-cs-pink">🌸 Akko CS Pink (Tactile)</option>
                  </select>
                </div>
                <div style={settingRow}>
                  <label style={label}>Volume: {Math.round(settings.typingSoundVolume * 100)}%</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.typingSoundVolume}
                    onChange={(e) => saveSettings({ ...settings, typingSoundVolume: parseFloat(e.target.value) })}
                    style={slider}
                  />
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

// Beautiful Themes
const themes = {
  gemini: {
    name: "Gemini",
    description: "Vibrant gradients",
    primary: "#4285f4",
    secondary: "#9b72cb",
    accent: "#d96570",
    bg: "#f5f5f7",
    cardBg: "rgba(255, 255, 255, 0.7)",
    text: "#1d1d1f",
    border: "rgba(155, 114, 203, 0.2)",
  },
  midnight: {
    name: "Midnight",
    description: "Deep dark elegance",
    primary: "#6366f1",
    secondary: "#8b5cf6",
    accent: "#ec4899",
    bg: "#0a0a0f",
    cardBg: "rgba(20, 20, 30, 0.8)",
    text: "#e5e7eb",
    border: "rgba(99, 102, 241, 0.3)",
  },
  forest: {
    name: "Forest",
    description: "Natural greens",
    primary: "#10b981",
    secondary: "#059669",
    accent: "#34d399",
    bg: "#f0fdf4",
    cardBg: "rgba(255, 255, 255, 0.9)",
    text: "#064e3b",
    border: "rgba(16, 185, 129, 0.2)",
  },
  sunset: {
    name: "Sunset",
    description: "Warm oranges",
    primary: "#f59e0b",
    secondary: "#ef4444",
    accent: "#f97316",
    bg: "#fff7ed",
    cardBg: "rgba(255, 255, 255, 0.9)",
    text: "#7c2d12",
    border: "rgba(245, 158, 11, 0.3)",
  },
  ocean: {
    name: "Ocean",
    description: "Cool blues",
    primary: "#06b6d4",
    secondary: "#3b82f6",
    accent: "#8b5cf6",
    bg: "#f0f9ff",
    cardBg: "rgba(255, 255, 255, 0.9)",
    text: "#0c4a6e",
    border: "rgba(6, 182, 212, 0.3)",
  },
  lavender: {
    name: "Lavender",
    description: "Soft purples",
    primary: "#a78bfa",
    secondary: "#c084fc",
    accent: "#e879f9",
    bg: "#faf5ff",
    cardBg: "rgba(255, 255, 255, 0.9)",
    text: "#581c87",
    border: "rgba(167, 139, 250, 0.3)",
  },
  charcoal: {
    name: "Charcoal",
    description: "Monochrome",
    primary: "#6b7280",
    secondary: "#9ca3af",
    accent: "#d1d5db",
    bg: "#1f2937",
    cardBg: "rgba(31, 41, 55, 0.9)",
    text: "#f9fafb",
    border: "rgba(107, 114, 128, 0.3)",
  },
  rose: {
    name: "Rose",
    description: "Pink elegance",
    primary: "#f43f5e",
    secondary: "#ec4899",
    accent: "#f472b6",
    bg: "#fff1f2",
    cardBg: "rgba(255, 255, 255, 0.9)",
    text: "#881337",
    border: "rgba(244, 63, 94, 0.3)",
  },
};

const overlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.7)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  backdropFilter: "blur(4px)",
  padding: "20px",
};

const modal = {
  backgroundColor: "var(--card-bg, rgba(255, 255, 255, 0.95))",
  borderRadius: "24px",
  maxWidth: "800px",
  width: "100%",
  maxHeight: "90vh",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
  overflow: "hidden",
  border: "1px solid var(--border-color, rgba(155, 114, 203, 0.2))",
  backdropFilter: "blur(10px)",
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "24px 28px",
  borderBottom: "1px solid var(--border-color, rgba(155, 114, 203, 0.2))",
  backgroundColor: "var(--card-bg, rgba(255, 255, 255, 0.95))",
};

const title = {
  margin: 0,
  fontSize: "28px",
  fontWeight: 600,
  color: "var(--text-color, #1d1d1f)",
  letterSpacing: "-0.5px",
  background: "linear-gradient(135deg, var(--primary-color, #4285f4), var(--secondary-color, #9b72cb))",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

const closeBtn = {
  background: "none",
  border: "none",
  fontSize: "32px",
  cursor: "pointer",
  padding: "0",
  width: "36px",
  height: "36px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "8px",
  transition: "all 0.2s",
  color: "var(--text-color, #1d1d1f)",
};

const content = {
  padding: "28px",
  overflowY: "auto",
  flex: 1,
  backgroundColor: "var(--card-bg, rgba(255, 255, 255, 0.95))",
};

const section = {
  marginBottom: "32px",
};

const sectionTitle = {
  fontSize: "18px",
  fontWeight: 600,
  color: "var(--text-color, #1d1d1f)",
  marginBottom: "16px",
  letterSpacing: "-0.3px",
};

const themeGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
  gap: "12px",
};

const themeCard = {
  padding: "16px",
  borderRadius: "12px",
  cursor: "pointer",
  transition: "all 0.2s ease",
  border: "2px solid var(--border-color)",
  backgroundColor: "var(--card-bg)",
};

const settingRow = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  marginBottom: "20px",
};

const label = {
  fontSize: "14px",
  fontWeight: 500,
  color: "var(--text-color, #1d1d1f)",
};

const select = {
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid var(--border-color, rgba(155, 114, 203, 0.3))",
  backgroundColor: "var(--card-bg, rgba(255, 255, 255, 0.9))",
  color: "var(--text-color, #1d1d1f)",
  fontSize: "14px",
  cursor: "pointer",
  outline: "none",
  fontFamily: "inherit",
};

const slider = {
  width: "100%",
  cursor: "pointer",
};

const checkboxLabel = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  fontSize: "14px",
  fontWeight: 500,
  color: "var(--text-color, #1d1d1f)",
  cursor: "pointer",
};

const checkbox = {
  width: "18px",
  height: "18px",
  cursor: "pointer",
  accentColor: "var(--primary-color, #4285f4)",
};

