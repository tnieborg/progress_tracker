import React, { useState } from "react";
import "../ui/ui.css";

export default function AddPerson({ onAdd, disabled }) {
        const [name, setName] = useState("");
        const [email, setEmail] = useState("");
        const [status, setStatus] = useState("watching");

        const handleSubmit = () => {
                const n = name.trim();
                const e = email.trim();
                if (!n || !e) return;
                onAdd({ name: n, email: e, status });
                setName("");
                setEmail("");
                setStatus("watching");
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
                                placeholder="Name"
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
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSubmit();
                                }}
                        >
                                <option value="watching">watching</option>
                                <option value="ongoing">ongoing</option>
                                <option value="completed">completed</option>
                        </select>
                        <button onClick={handleSubmit} disabled={disabled}>
                                Add
                        </button>
                </div>
        );
}
