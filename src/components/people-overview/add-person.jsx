import React, { useState } from "react";
import "../ui/ui.css";

export default function AddPerson({ onAdd, disabled }) {
        const [name, setName] = useState("");
        const [email, setEmail] = useState("");
        const [role, setRole] = useState("collaborator");

        const handleSubmit = () => {
                const n = name.trim();
                const e = email.trim().toLowerCase();
                if (!e) return;
                const payload = { email: e, role };
                if (n) payload.name = n;
                onAdd(payload);
                setName("");
                setEmail("");
                setRole("collaborator");
        };

        return (
                <div
                        className="add-row"
                        style={{ gridTemplateColumns: "1fr 1fr auto auto" }}
                >
                        <input
                                disabled={disabled}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSubmit();
                                }}
                                placeholder="Name (optional)"
                        />
                        <input
                                disabled={disabled}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSubmit();
                                }}
                                placeholder="Email"
                                type="email"
                        />
                        <select
                                disabled={disabled}
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSubmit();
                                }}
                        >
                                <option value="admin">admin</option>
                                <option value="editor">editor</option>
                                <option value="collaborator">collaborator</option>
                        </select>
                        <button onClick={handleSubmit} disabled={disabled}>
                                Add
                        </button>
                </div>
        );
}
