import { useState } from "react";
import "./AuthPage.css";

export default function PrivacyModal({ isOpen, onClose }) {
  const [closeHover, setCloseHover] = useState(false);
  const [acceptHover, setAcceptHover] = useState(false);

  if (!isOpen) return null;

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={header}>
          <h2 style={title}>Privacy Policy</h2>
          <button
            style={{
              ...closeBtn,
              backgroundColor: closeHover ? "rgba(0,0,0,0.05)" : "transparent",
              color: closeHover ? "var(--text-color)" : "#999",
            }}
            onClick={onClose}
            onMouseEnter={() => setCloseHover(true)}
            onMouseLeave={() => setCloseHover(false)}
          >
            ×
          </button>
        </div>
        <div style={content}>
          <p style={lastUpdated}>Last Updated: {new Date().toLocaleDateString()}</p>

          <section style={section}>
            <h3 style={sectionTitle}>1. Information We Collect</h3>
            <p style={text}>
              We collect information that you provide directly to us, including:
            </p>
            <ul style={list}>
              <li>Username and password for account creation</li>
              <li>Notes and content you create within the application</li>
              <li>Usage data and interactions with the service</li>
            </ul>
          </section>

          <section style={section}>
            <h3 style={sectionTitle}>2. How We Use Your Information</h3>
            <p style={text}>We use the information we collect to:</p>
            <ul style={list}>
              <li>Provide, maintain, and improve our services</li>
              <li>Authenticate your account and secure your data</li>
              <li>Store and sync your notes across devices</li>
              <li>Respond to your requests and provide customer support</li>
            </ul>
          </section>

          <section style={section}>
            <h3 style={sectionTitle}>3. Data Storage and Security</h3>
            <p style={text}>
              Your data is stored securely using Firebase. We implement appropriate
              technical and organizational measures to protect your personal
              information against unauthorized access, alteration, disclosure, or
              destruction. Passwords are hashed before storage.
            </p>
          </section>

          <section style={section}>
            <h3 style={sectionTitle}>4. Data Sharing</h3>
            <p style={text}>
              We do not sell, trade, or rent your personal information to third
              parties. Your notes and data are private and only accessible to you
              through your authenticated account.
            </p>
          </section>

          <section style={section}>
            <h3 style={sectionTitle}>5. Your Rights</h3>
            <p style={text}>You have the right to:</p>
            <ul style={list}>
              <li>Access your personal data</li>
              <li>Delete your account and associated data</li>
              <li>Export your notes and content</li>
              <li>Request correction of inaccurate data</li>
            </ul>
          </section>

          <section style={section}>
            <h3 style={sectionTitle}>6. Cookies and Tracking</h3>
            <p style={text}>
              We use local storage to maintain your session and preferences. We do
              not use tracking cookies or third-party analytics that collect
              personal information.
            </p>
          </section>

          <section style={section}>
            <h3 style={sectionTitle}>7. Children's Privacy</h3>
            <p style={text}>
              Our service is not intended for children under 13 years of age. We do
              not knowingly collect personal information from children under 13.
            </p>
          </section>

          <section style={section}>
            <h3 style={sectionTitle}>8. Changes to This Policy</h3>
            <p style={text}>
              We may update this Privacy Policy from time to time. We will notify
              you of any changes by posting the new Privacy Policy on this page and
              updating the "Last Updated" date.
            </p>
          </section>

          <section style={section}>
            <h3 style={sectionTitle}>9. Contact Us</h3>
            <p style={text}>
              If you have any questions about this Privacy Policy, please contact
              us through the application or via Instagram @ilanbarts.
            </p>
          </section>
        </div>
        <div style={footer}>
          <button
            style={{
              ...acceptBtn,
              transform: acceptHover ? "translateY(-2px)" : "translateY(0)",
            }}
            onClick={onClose}
            onMouseEnter={() => setAcceptHover(true)}
            onMouseLeave={() => setAcceptHover(false)}
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}

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
  backgroundColor: "var(--inner-bg)",
  borderRadius: "24px",
  maxWidth: "700px",
  width: "100%",
  maxHeight: "90vh",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
  overflow: "hidden",
  border: "1px solid var(--input-border)",
  backdropFilter: "blur(10px)",
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "24px 28px",
  borderBottom: "1px solid var(--input-border)",
  backgroundColor: "var(--card-bg)",
};

const title = {
  margin: 0,
  fontSize: "28px",
  fontWeight: 600,
  color: "var(--text-color)",
  letterSpacing: "-0.5px",
  background: "linear-gradient(135deg, var(--gemini-1), var(--gemini-2), var(--gemini-3))",
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
  color: "var(--text-color)",
};

const content = {
  padding: "28px",
  overflowY: "auto",
  flex: 1,
  backgroundColor: "var(--inner-bg, #ffffff)",
  color: "var(--text-color, #1d1d1f)",
};

const lastUpdated = {
  fontSize: "14px",
  color: "var(--text-color, #1d1d1f)",
  opacity: 0.6,
  marginBottom: "24px",
  fontStyle: "italic",
};

const section = {
  marginBottom: "28px",
};

const sectionTitle = {
  fontSize: "20px",
  fontWeight: 600,
  color: "var(--text-color)",
  marginBottom: "12px",
  letterSpacing: "-0.3px",
};

const text = {
  fontSize: "15px",
  lineHeight: "1.7",
  color: "var(--text-color, #1d1d1f)",
  opacity: 0.9,
  marginBottom: "12px",
};

const list = {
  marginLeft: "20px",
  marginTop: "8px",
  marginBottom: "12px",
  paddingLeft: "20px",
  listStyleType: "disc",
  color: "var(--text-color, #1d1d1f)",
  opacity: 0.9,
  lineHeight: "1.7",
};

const footer = {
  padding: "20px 28px",
  borderTop: "1px solid var(--input-border)",
  backgroundColor: "var(--card-bg)",
  display: "flex",
  justifyContent: "flex-end",
};

const acceptBtn = {
  padding: "12px 32px",
  background: "linear-gradient(135deg, var(--gemini-1), var(--gemini-2), var(--gemini-3))",
  backgroundSize: "200% 200%",
  color: "white",
  border: "none",
  borderRadius: "12px",
  fontSize: "16px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.3s ease",
  animation: "gradientMove 4s ease infinite",
};
