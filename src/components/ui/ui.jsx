import React, { useState } from "react";
import "./ui.css";

export const PALETTES = {
	royalViolet: { name: "Royal Violet" },
	coralSpark: { name: "Coral Spark" },
	neonCyan: { name: "Neon Cyan" },
};

export function Card({ title, right, children }) {
	return (
		<div className="card">
			<div className="card-header">
				<h3 className="card-title">{title}</h3>
				{right}
			</div>
			{children}
		</div>
	);
}

export function Button({ children, onClick, subtle, disabled }) {
	return (
		<button
			onClick={onClick}
			disabled={disabled}
			className={`btn ${subtle ? "btn-subtle" : ""}`}
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
                if (type === "projects") onAdd({ name: v, percent: 0 });
                if (type === "goals") onAdd({ title: v, status: "todo" });
		setText("");
	};
	return (
		<div className="add-row">
                        <input
                                disabled={disabled}
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSubmit();
                                }}
                                placeholder={placeholder}
                        />
                        <button onClick={handleSubmit} disabled={disabled}>
                                Add
                        </button>
                </div>
	);
}
