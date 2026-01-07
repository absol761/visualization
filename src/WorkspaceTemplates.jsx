import { useState } from "react";

export default function WorkspaceTemplates({ onSelectTemplate, onClose, isOpen }) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  if (!isOpen) return null;

  const templateCategories = {
    all: "All Templates",
    productivity: "Productivity",
    creative: "Creative",
    research: "Research",
    planning: "Planning",
    focus: "Focus",
  };

  const templates = [
    // Productivity
    {
      id: "productivity-1",
      name: "Task Master",
      category: "productivity",
      icon: "✅",
      description: "Perfect for managing tasks and staying organized",
      layout: {
        showJournal: false,
        showTasks: true,
        showGraph: true,
        showNote: false,
        showPDF: false,
        journalWidth: 320,
        tasksWidth: 400,
        noteWidth: 400,
        layoutType: "graph-focused",
      },
    },
    {
      id: "productivity-2",
      name: "Daily Planner",
      category: "productivity",
      icon: "📅",
      description: "Journal + Tasks for daily planning",
      layout: {
        showJournal: true,
        showTasks: true,
        showGraph: true,
        showNote: false,
        showPDF: false,
        journalWidth: 320,
        tasksWidth: 360,
        layoutType: "graph-focused",
      },
    },
    {
      id: "productivity-3",
      name: "Project Manager",
      category: "productivity",
      icon: "📊",
      description: "Full workspace for project management",
      layout: {
        showJournal: true,
        showTasks: true,
        showGraph: true,
        showNote: true,
        showPDF: false,
        journalWidth: 300,
        tasksWidth: 340,
        noteWidth: 380,
        layoutType: "three-pane",
      },
    },

    // Creative
    {
      id: "creative-1",
      name: "Writer's Den",
      category: "creative",
      icon: "✍️",
      description: "Distraction-free writing environment",
      layout: {
        showJournal: false,
        showTasks: false,
        showGraph: false,
        showNote: true,
        showPDF: false,
        noteWidth: "100%",
        layoutType: "focus",
      },
    },
    {
      id: "creative-2",
      name: "Brainstorming",
      category: "creative",
      icon: "💡",
      description: "Journal + Graph for capturing ideas",
      layout: {
        showJournal: true,
        showTasks: false,
        showGraph: true,
        showNote: false,
        showPDF: false,
        journalWidth: 320,
        layoutType: "graph-focused",
      },
    },
    {
      id: "creative-3",
      name: "Idea Lab",
      category: "creative",
      icon: "🧪",
      description: "Full creative workspace with all tools",
      layout: {
        showJournal: true,
        showTasks: false,
        showGraph: true,
        showNote: true,
        showPDF: false,
        journalWidth: 300,
        noteWidth: 400,
        layoutType: "three-pane",
      },
    },

    // Research
    {
      id: "research-1",
      name: "Research Hub",
      category: "research",
      icon: "🔬",
      description: "Graph + Note panel for research workflow",
      layout: {
        showJournal: false,
        showTasks: true,
        showGraph: true,
        showNote: true,
        showPDF: false,
        tasksWidth: 360,
        noteWidth: 420,
        layoutType: "three-pane",
      },
    },
    {
      id: "research-2",
      name: "Study Mode",
      category: "research",
      icon: "📚",
      description: "Focused research with note-taking",
      layout: {
        showJournal: true,
        showTasks: false,
        showGraph: true,
        showNote: true,
        showPDF: false,
        journalWidth: 300,
        noteWidth: 400,
        layoutType: "three-pane",
      },
    },
    {
      id: "research-3",
      name: "Knowledge Base",
      category: "research",
      icon: "🧠",
      description: "Complete research workspace",
      layout: {
        showJournal: true,
        showTasks: true,
        showGraph: true,
        showNote: true,
        showPDF: false,
        journalWidth: 280,
        tasksWidth: 320,
        noteWidth: 380,
        layoutType: "three-pane",
      },
    },

    // Planning
    {
      id: "planning-1",
      name: "Strategic Planning",
      category: "planning",
      icon: "🗺️",
      description: "Graph-focused for visual planning",
      layout: {
        showJournal: false,
        showTasks: true,
        showGraph: true,
        showNote: false,
        showPDF: false,
        tasksWidth: 380,
        layoutType: "graph-focused",
      },
    },
    {
      id: "planning-2",
      name: "Roadmap Builder",
      category: "planning",
      icon: "🛣️",
      description: "Tasks + Graph for project roadmaps",
      layout: {
        showJournal: false,
        showTasks: true,
        showGraph: true,
        showNote: true,
        showPDF: false,
        tasksWidth: 360,
        noteWidth: 400,
        layoutType: "three-pane",
      },
    },
    {
      id: "planning-3",
      name: "Goal Setter",
      category: "planning",
      icon: "🎯",
      description: "Journal + Tasks for goal tracking",
      layout: {
        showJournal: true,
        showTasks: true,
        showGraph: true,
        showNote: false,
        showPDF: false,
        journalWidth: 320,
        tasksWidth: 360,
        layoutType: "graph-focused",
      },
    },

    // Focus
    {
      id: "focus-1",
      name: "Deep Focus",
      category: "focus",
      icon: "🎯",
      description: "Minimal distraction, maximum focus",
      layout: {
        showJournal: false,
        showTasks: false,
        showGraph: false,
        showNote: true,
        showPDF: false,
        noteWidth: "100%",
        layoutType: "focus",
      },
    },
    {
      id: "focus-2",
      name: "Reading Mode",
      category: "focus",
      icon: "📖",
      description: "Clean interface for reading notes",
      layout: {
        showJournal: false,
        showTasks: false,
        showGraph: true,
        showNote: false,
        showPDF: false,
        layoutType: "graph-only",
      },
    },
    {
      id: "focus-3",
      name: "Minimalist",
      category: "focus",
      icon: "✨",
      description: "Clean and simple workspace",
      layout: {
        showJournal: false,
        showTasks: false,
        showGraph: true,
        showNote: false,
        showPDF: false,
        layoutType: "graph-only",
      },
    },
  ];

  const filteredTemplates =
    selectedCategory === "all"
      ? templates
      : templates.filter((t) => t.category === selectedCategory);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1001,
        backdropFilter: "blur(4px)",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(10px)",
          borderRadius: "24px",
          maxWidth: "900px",
          width: "100%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          border: "1px solid rgba(155, 114, 203, 0.2)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px 28px",
            borderBottom: "1px solid rgba(155, 114, 203, 0.2)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: 600,
              color: "#9b72cb",
              background: "linear-gradient(135deg, #4285f4, #9b72cb)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            🎨 Workspace Templates
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "28px",
              cursor: "pointer",
              color: "#999",
              padding: "0",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* Category Tabs */}
        <div
          style={{
            padding: "16px 28px",
            borderBottom: "1px solid rgba(155, 114, 203, 0.1)",
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            backgroundColor: "rgba(155, 114, 203, 0.02)",
          }}
        >
          {Object.entries(templateCategories).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              style={{
                padding: "8px 16px",
                borderRadius: "10px",
                border: "1px solid rgba(155, 114, 203, 0.3)",
                background:
                  selectedCategory === key
                    ? "linear-gradient(135deg, #4285f4, #9b72cb)"
                    : "rgba(155, 114, 203, 0.05)",
                color: selectedCategory === key ? "white" : "#9b72cb",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div
          style={{
            padding: "24px 28px",
            overflowY: "auto",
            flex: 1,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "16px",
          }}
        >
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              onClick={() => {
                onSelectTemplate(template);
                onClose();
              }}
              style={{
                padding: "20px",
                borderRadius: "16px",
                border: "2px solid rgba(155, 114, 203, 0.2)",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#9b72cb";
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 24px rgba(155, 114, 203, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(155, 114, 203, 0.2)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "4px" }}>
                {template.icon}
              </div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#1d1d1f",
                }}
              >
                {template.name}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "13px",
                  color: "#666",
                  lineHeight: "1.5",
                }}
              >
                {template.description}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  marginTop: "8px",
                  flexWrap: "wrap",
                }}
              >
                {template.layout.showJournal && (
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      backgroundColor: "rgba(155, 114, 203, 0.1)",
                      color: "#9b72cb",
                      fontSize: "11px",
                      fontWeight: 500,
                    }}
                  >
                    📔 Journal
                  </span>
                )}
                {template.layout.showTasks && (
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      backgroundColor: "rgba(155, 114, 203, 0.1)",
                      color: "#9b72cb",
                      fontSize: "11px",
                      fontWeight: 500,
                    }}
                  >
                    📋 Tasks
                  </span>
                )}
                {template.layout.showGraph && (
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      backgroundColor: "rgba(155, 114, 203, 0.1)",
                      color: "#9b72cb",
                      fontSize: "11px",
                      fontWeight: 500,
                    }}
                  >
                    🗺️ Graph
                  </span>
                )}
                {template.layout.showNote && (
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      backgroundColor: "rgba(155, 114, 203, 0.1)",
                      color: "#9b72cb",
                      fontSize: "11px",
                      fontWeight: 500,
                    }}
                  >
                    📝 Note
                  </span>
                )}
                {template.layout.layoutType === "focus" && (
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      backgroundColor: "rgba(66, 133, 244, 0.1)",
                      color: "#4285f4",
                      fontSize: "11px",
                      fontWeight: 500,
                    }}
                  >
                    🎯 Focus
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

