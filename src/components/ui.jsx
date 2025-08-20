import React, { useState } from "react";

export const PALETTES = {
  royalViolet: {
    name: "Royal Violet",
    bg: "#1B1B2F",
    card: "#2C2C3E",
    text: "#F1F1F8",
    accent: "#9D4EDD",
    accentSubtle: "#C77DFF",
  },
  coralSpark: {
    name: "Coral Spark",
    bg: "#202124",
    card: "#2F3136",
    text: "#EEEEEE",
    accent: "#FF6B6B",
    accentSubtle: "#FF9F80",
  },
  neonCyan: {
    name: "Neon Cyan",
    bg: "#0D1B2A",
    card: "#1B263B",
    text: "#E0E1DD",
    accent: "#00B4D8",
    accentSubtle: "#90E0EF",
  },
};

export function Card({ palette, title, right, children }) {
  return (
    <div
      style={{
        background: PALETTES[palette].card,
        border: `1px solid ${PALETTES[palette].accent}22`,
        borderRadius: 16,
        padding: 16,
        boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0, color: PALETTES[palette].text }}>{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}

export function Button({ children, onClick, subtle, palette, style, disabled }) {
  const p = PALETTES[palette];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "8px 12px",
        borderRadius: 10,
        border: `1px solid ${p.accent}${subtle ? "55" : "AA"}`,
        background: subtle ? "transparent" : `${p.accent}22`,
        color: p.text,
        cursor: disabled ? "not-allowed" : "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function AddRow({ type, onAdd, disabled, placeholder }) {
  const [text, setText] = useState("");
  const handleSubmit = () => {
    const v = text.trim();
    if (!v) return;
    if (type === "people") onAdd({ name: v, status: "watching" });
    if (type === "progress") onAdd({ label: v, value: 0, goalIds: [], auto: false });
    if (type === "goals") onAdd({ title: v, percent: 0 });
    setText("");
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginTop: 12 }}>
      <input
        disabled={disabled}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        style={{
          background: "transparent",
          color: "inherit",
          border: "1px solid rgba(255,255,255,.2)",
          borderRadius: 8,
          padding: "8px 10px",
        }}
      />
      <button
        onClick={handleSubmit}
        disabled={disabled}
        style={{ borderRadius: 8, border: "1px solid rgba(255,255,255,.3)", padding: "8px 10px" }}
      >
        Add
      </button>
    </div>
  );
}
