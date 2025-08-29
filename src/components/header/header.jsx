import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { PALETTES } from "../../constants/palettes";
import AuthPanel from "./auth-panel";
import MobileMenu from "./mobile-menu";
import "./header.css";

export default function Header({
        paletteKey,
        setPaletteKey,
        user,
        auth,
        workspaces,
        currentWsId,
        createWorkspace,
        showWorkspaceMenu = true,
}) {
        const [showPalette, setShowPalette] = useState(false);
        const location = useLocation();
        const isHome = location.pathname === "/";
        const isProfile = location.pathname.startsWith("/profile");
        return (
                <div className="header">
                        <h2 className="header-title">
                                <Link to="/">Project Tracker</Link>
                        </h2>
                        <div className="header-controls">
				<AuthPanel user={user} auth={auth} />
                        {showWorkspaceMenu && (
                                <>
                                        <label className="theme-label">Theme</label>
                                        <select
                                                className="theme-select"
                                                value={paletteKey}
                                                onChange={(e) => setPaletteKey(e.target.value)}
                                        >
                                                {Object.entries(PALETTES).map(([k, v]) => (
                                                        <option key={k} value={k}>
                                                                {v.name}
                                                        </option>
                                                ))}
                                        </select>
                                </>
                        )}
                        </div>
                        {showWorkspaceMenu && (
                                <MobileMenu
                                        paletteKey={paletteKey}
                                        setPaletteKey={setPaletteKey}
                                        user={user}
                                        workspaces={workspaces}
                                        currentWsId={currentWsId}
                                        createWorkspace={createWorkspace}
                                />
                        )}
                        <nav className="header-nav">
                                <Link className={`header-icon-btn ${isHome ? "active" : ""}`} to="/" aria-label="Home">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M4 10L12 3l8 7v9a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9z" stroke="currentColor" strokeWidth="2" fill="none"/>
                                        </svg>
                                        <span className="header-icon-label">Home</span>
                                </Link>
                                <button className="header-icon-btn" aria-label="Theme" onClick={() => setShowPalette(true)}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12 3a9 9 0 1 0 0 18 2 2 0 0 0 2-2 2 2 0 0 1 2-2h2a3 3 0 0 0 0-6h-1a2 2 0 0 1-2-2 2 2 0 0 0-2-2 9 9 0 0 0-1 0z" stroke="currentColor" strokeWidth="2" fill="none"/>
                                        </svg>
                                        <span className="header-icon-label">Theme</span>
                                </button>
                                <Link className={`header-icon-btn ${isProfile ? "active" : ""}`} to="/profile/edit" aria-label="Profile">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-5 0-9 2.5-9 5v1h18v-1c0-2.5-4-5-9-5z" stroke="currentColor" strokeWidth="2" fill="none"/>
                                        </svg>
                                        <span className="header-icon-label">Profile</span>
                                </Link>
                        </nav>
                        {showPalette && (
                                <div className="palette-sheet-overlay" onClick={() => setShowPalette(false)}>
                                        <div className="palette-sheet" onClick={(e) => e.stopPropagation()}>
                                                <div className="palette-sheet-header">
                                                        <span>Choose Theme</span>
                                                        <button className="palette-sheet-close" onClick={() => setShowPalette(false)} aria-label="Close">Ã—</button>
                                                </div>
                                                <div className="palette-list">
                                                        {Object.entries(PALETTES).map(([k, v]) => (
                                                                <button key={k} className={`palette-item ${k === paletteKey ? "active" : ""}`} onClick={() => { setPaletteKey(k); setShowPalette(false); }}>
                                                                        <span className={`palette-color palette-${k}`} />
                                                                        <span className="palette-name">{v.name}</span>
                                                                </button>
                                                        ))}
                                                </div>
                                        </div>
                                </div>
                        )}
                </div>
        );
}



