import React, { useState } from "react";
import { Link } from "react-router-dom";
import { PALETTES, Button } from "../ui/ui";

export default function MobileMenu({
        paletteKey,
        setPaletteKey,
        user,
        workspaces,
        currentWsId,
        createWorkspace,
}) {
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	return (
		<div className="mobile-menu-container">
			<button
				className="mobile-menu-button"
				onClick={() => setOpen(true)}
			>
				☰
			</button>
			<div
				className={`mobile-menu-overlay ${open ? "open" : ""}`}
				onClick={() => setOpen(false)}
			>
				<div
					className="mobile-menu-drawer"
					onClick={(e) => e.stopPropagation()}
				>
                                        <button
                                                className="mobile-menu-close"
                                                onClick={() => setOpen(false)}
                                        >
                                                ✕
                                        </button>
                                        {user && (
                                                <>
                                                        <span className="greeting">
                                                                {user.displayName || user.email}
                                                        </span>
                                                        <Link
                                                                to="/profile/edit"
                                                                className="auth-link"
                                                                onClick={() => setOpen(false)}
                                                        >
                                                                Profile
                                                        </Link>
                                                </>
                                        )}
                                        <span className="mobile-menu-heading">Workspaces</span>
                                        <div className="mobile-workspaces">
                                                {workspaces.length === 0 && (
                                                        <span>No workspaces yet</span>
                                                )}
                                                {workspaces.map((w) => (
                                                        <Link
                                                                key={w.id}
                                                                to={`/workspace/${w.id}`}
                                                                className={
                                                                        w.id === currentWsId
                                                                                ? "workspace-link active"
                                                                                : "workspace-link"
                                                                }
                                                                onClick={() => setOpen(false)}
                                                        >
                                                                {w.name || "Untitled"}
                                                        </Link>
                                                ))}
                                        </div>
                                        <div className="mobile-workspace-create">
                                                <input
                                                        className="workspace-bar-input"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        placeholder="New workspace name"
                                                />
                                                <Button
                                                        onClick={async () => {
                                                                const n = name.trim();
                                                                if (!n) return;
                                                                await createWorkspace(n);
                                                                setName("");
                                                                setOpen(false);
                                                        }}
                                                >
                                                        Create
                                                </Button>
                                        </div>
                                        <span className="mobile-menu-heading">Theme</span>
                                        <select
                                                className="theme-select"
                                                value={paletteKey}
                                                onChange={(e) => {
                                                        setPaletteKey(e.target.value);
                                                        setOpen(false);
                                                }}
                                        >
                                                {Object.entries(PALETTES).map(([k, v]) => (
                                                        <option key={k} value={k}>
                                                                {v.name}
                                                        </option>
                                                ))}
                                        </select>
                                </div>
                        </div>
                </div>
        );
}
