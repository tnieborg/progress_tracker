import React, { useState } from "react";
import "./ui.css";

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

export function AddRow({ type, onAdd, disabled, placeholder, people = [] }) {
        const [text, setText] = useState("");
        const [assigneeUid, setAssigneeUid] = useState("");
        const handleSubmit = () => {
                const v = text.trim();
                if (!v) return;
                if (type === "projects") onAdd({ name: v, percent: 0 });
                if (type === "goals")
                        onAdd({ title: v, status: "todo", assigneeUid });
                setText("");
                setAssigneeUid("");
        };
        return (
                <div className={`add-row ${type === "goals" ? "add-row-goal" : ""}`}>
                        <input
                                disabled={disabled}
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSubmit();
                                }}
                                placeholder={placeholder}
                        />
                        {type === "goals" && (
                                <select
                                        className="status-select"
                                        value={assigneeUid}
                                        onChange={(e) => setAssigneeUid(e.target.value)}
                                        disabled={disabled}
                                >
                                        <option value="">Unassigned</option>
                                        {people.map((p) => (
                                                <option key={p.uid} value={p.uid}>
                                                        {p.name || p.email}
                                                </option>
                                        ))}
                                </select>
                        )}
                        <button onClick={handleSubmit} disabled={disabled}>
                                Add
                        </button>
                </div>
        );
}
