import { useState, useEffect } from "react";
import { collection, doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

export default function Tutorial({ user, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const tutorialCol = user ? collection(db, "users", user.id, "tutorial") : null;

  useEffect(() => {
    if (!tutorialCol) return;
    const unsubscribe = onSnapshot(doc(tutorialCol, "progress"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.completed) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
          setCurrentStep(data.currentStep || 0);
        }
      } else {
        // New user - start tutorial
        setIsVisible(true);
        setCurrentStep(0);
      }
    });
    return () => unsubscribe();
  }, [tutorialCol]);

  const steps = [
    {
      title: "Welcome to Mind Map! 🎉",
      content: "Let's take a quick tour of all the amazing features. You can skip anytime.",
      target: null,
      position: "center",
    },
    {
      title: "Create Your First Note",
      content: "Click the '+ New Note' button to create a note. Double-click any note to edit it.",
      target: "new-note-btn",
      position: "bottom",
    },
    {
      title: "Daily Journal 📔",
      content: "Use the Daily Journal for quick capture. Drag entries to the canvas to create notes!",
      target: "journal-panel",
      position: "right",
    },
    {
      title: "Task Management 📋",
      content: "Add checkboxes to notes using '- [ ] Task name'. All tasks appear here, organized by due date!",
      target: "tasks-panel",
      position: "left",
    },
    {
      title: "Workspaces 🎨",
      content: "Switch between different layouts! Try Research (⌘1), Writing (⌘2), or Planning (⌘3) workspaces.",
      target: "workspaces-btn",
      position: "bottom",
    },
    {
      title: "Settings ⚙️",
      content: "Customize your experience! Choose from 8 beautiful themes, adjust fonts, animations, and enable typing sounds (like mechvibes)!",
      target: "settings-btn",
      position: "bottom",
    },
    {
      title: "Typing Sounds 🎹",
      content: "Enable typing sounds in Settings for a satisfying mechanical keyboard experience! Choose from 21 premium switch types including Gateron KS-3 Milky Yellow Pro, Holy Boba U4T, Alpacas, Ink Black, and many more!",
      target: "settings-btn",
      position: "bottom",
    },
    {
      title: "Connect Your Ideas",
      content: "Drag from one note to another to create connections. Build your knowledge graph!",
      target: null,
      position: "center",
    },
    {
      title: "You're All Set! 🚀",
      content: "Start mapping your thoughts and ideas. Happy exploring!",
      target: null,
      position: "center",
    },
  ];

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      if (tutorialCol) {
        await setDoc(doc(tutorialCol, "progress"), { currentStep: nextStep, completed: false });
      }
    } else {
      await handleComplete();
    }
  };

  const handlePrevious = async () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      if (tutorialCol) {
        await setDoc(doc(tutorialCol, "progress"), { currentStep: prevStep, completed: false });
      }
    }
  };

  const handleSkip = async () => {
    await handleComplete();
  };

  const handleComplete = async () => {
    setIsVisible(false);
    if (tutorialCol) {
      await setDoc(doc(tutorialCol, "progress"), { completed: true, completedAt: Date.now() });
    }
    if (onComplete) onComplete();
  };

  const [position, setPosition] = useState({ top: "50%", left: "50%", transform: "translate(-50%, -50%)" });
  const [highlightStyle, setHighlightStyle] = useState(null);

  useEffect(() => {
    if (!isVisible) return;
    
    const step = steps[currentStep];
    if (!step) return;
    const targetElement = step.target ? document.querySelector(`[data-tutorial="${step.target}"]`) : null;
    
    if (targetElement) {
      const updatePosition = () => {
        // First, ensure the target element is visible by scrolling it into view
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        
        // Wait a bit for scroll to complete, then calculate positions
        setTimeout(() => {
          const rect = targetElement.getBoundingClientRect();
          const scrollY = window.scrollY || window.pageYOffset;
          const scrollX = window.scrollX || window.pageXOffset;
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const cardWidth = 400;
          const cardHeight = 300; // Approximate card height
          const padding = 20;
          
          let newTop = "50%";
          let newLeft = "50%";
          let newTransform = "translate(-50%, -50%)";
          
          // Calculate desired position based on step.position
          let desiredTop = 0;
          let desiredLeft = 0;
          
          switch (step.position) {
            case "bottom":
              desiredTop = rect.bottom + scrollY + padding;
              desiredLeft = rect.left + scrollX + rect.width / 2;
              newTransform = "translateX(-50%)";
              break;
            case "top":
              desiredTop = rect.top + scrollY - padding;
              desiredLeft = rect.left + scrollX + rect.width / 2;
              newTransform = "translate(-50%, -100%)";
              break;
            case "right":
              desiredTop = rect.top + scrollY + rect.height / 2;
              desiredLeft = rect.right + scrollX + padding;
              newTransform = "translateY(-50%)";
              break;
            case "left":
              desiredTop = rect.top + scrollY + rect.height / 2;
              desiredLeft = rect.left + scrollX - padding;
              newTransform = "translate(-100%, -50%)";
              break;
            default:
              desiredTop = scrollY + viewportHeight / 2;
              desiredLeft = scrollX + viewportWidth / 2;
          }
          
          // Constrain tutorial card to viewport
          // For top/bottom positioning
          if (step.position === "bottom" || step.position === "top") {
            // Ensure card doesn't go off left/right edges
            const halfCardWidth = cardWidth / 2;
            if (desiredLeft - halfCardWidth < scrollX + padding) {
              desiredLeft = scrollX + halfCardWidth + padding;
            } else if (desiredLeft + halfCardWidth > scrollX + viewportWidth - padding) {
              desiredLeft = scrollX + viewportWidth - halfCardWidth - padding;
            }
            
            // For bottom, ensure card doesn't go off bottom
            if (step.position === "bottom" && desiredTop + cardHeight > scrollY + viewportHeight - padding) {
              // Position above target instead
              desiredTop = rect.top + scrollY - padding;
              newTransform = "translate(-50%, -100%)";
            }
            
            // For top, ensure card doesn't go off top
            if (step.position === "top" && desiredTop - cardHeight < scrollY + padding) {
              // Position below target instead
              desiredTop = rect.bottom + scrollY + padding;
              newTransform = "translateX(-50%)";
            }
          }
          
          // For left/right positioning
          if (step.position === "right" || step.position === "left") {
            // Ensure card doesn't go off top/bottom edges
            const halfCardHeight = cardHeight / 2;
            if (desiredTop - halfCardHeight < scrollY + padding) {
              desiredTop = scrollY + halfCardHeight + padding;
            } else if (desiredTop + halfCardHeight > scrollY + viewportHeight - padding) {
              desiredTop = scrollY + viewportHeight - halfCardHeight - padding;
            }
            
            // For right, ensure card doesn't go off right edge
            if (step.position === "right" && desiredLeft + cardWidth > scrollX + viewportWidth - padding) {
              // Position to left of target instead
              desiredLeft = rect.left + scrollX - padding;
              newTransform = "translate(-100%, -50%)";
            }
            
            // For left, ensure card doesn't go off left edge
            if (step.position === "left" && desiredLeft - cardWidth < scrollX + padding) {
              // Position to right of target instead
              desiredLeft = rect.right + scrollX + padding;
              newTransform = "translateY(-50%)";
            }
          }
          
          newTop = `${desiredTop}px`;
          newLeft = `${desiredLeft}px`;
          
          setPosition({ top: newTop, left: newLeft, transform: newTransform });
          setHighlightStyle({
            top: `${rect.top + scrollY}px`,
            left: `${rect.left + scrollX}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
          });
        }, 300); // Wait for scroll animation
      };
      
      updatePosition();
      window.addEventListener("scroll", updatePosition);
      window.addEventListener("resize", updatePosition);
      
      return () => {
        window.removeEventListener("scroll", updatePosition);
        window.removeEventListener("resize", updatePosition);
      };
    } else {
      setPosition({ top: "50%", left: "50%", transform: "translate(-50%, -50%)" });
      setHighlightStyle(null);
    }
  }, [currentStep, isVisible]);

  if (!isVisible) return null;

  const step = steps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          zIndex: 9998,
          backdropFilter: "blur(2px)",
        }}
      />
      
      {/* Highlight target */}
      {highlightStyle && (
        <div
          style={{
            position: "absolute",
            ...highlightStyle,
            border: "3px solid #9b72cb",
            borderRadius: "12px",
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 20px rgba(155, 114, 203, 0.5)",
            zIndex: 9999,
            pointerEvents: "none",
            animation: "pulse 2s infinite",
            transition: "all 0.3s ease",
          }}
        />
      )}

      {/* Tutorial Card */}
      <div
        style={{
          position: "fixed",
          top: position.top,
          left: position.left,
          transform: position.transform,
          width: "400px",
          maxWidth: "90vw",
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(10px)",
          borderRadius: "20px",
          padding: "28px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          border: "2px solid rgba(155, 114, 203, 0.3)",
          zIndex: 10000,
          animation: "slideIn 0.3s ease",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 600, color: "#9b72cb" }}>
              {step.title}
            </h2>
            <button
              onClick={handleSkip}
              style={{
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: "#999",
                padding: "0",
                width: "28px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Skip tutorial"
            >
              ×
            </button>
          </div>
          <p style={{ margin: 0, fontSize: "15px", lineHeight: "1.6", color: "#666" }}>
            {step.content}
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px" }}>
          <div style={{ fontSize: "13px", color: "#999" }}>
            Step {currentStep + 1} of {steps.length}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                style={{
                  padding: "10px 20px",
                  background: "rgba(155, 114, 203, 0.1)",
                  border: "1px solid rgba(155, 114, 203, 0.3)",
                  color: "#9b72cb",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                Previous
              </button>
            )}
            <button
              onClick={handleNext}
              style={{
                padding: "10px 20px",
                background: "linear-gradient(135deg, #4285f4, #9b72cb)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              {currentStep === steps.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "20px" }}>
          {steps.map((_, idx) => (
            <div
              key={idx}
              style={{
                width: idx === currentStep ? "24px" : "8px",
                height: "8px",
                borderRadius: "4px",
                backgroundColor: idx === currentStep ? "#9b72cb" : "rgba(155, 114, 203, 0.3)",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 20px rgba(155, 114, 203, 0.5); }
          50% { box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 30px rgba(155, 114, 203, 0.8); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translate(-50%, -60%); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
      `}</style>
    </>
  );
}

