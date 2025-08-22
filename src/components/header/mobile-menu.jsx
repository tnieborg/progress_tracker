import React, { useState } from "react";
import { PALETTES } from "../ui/ui";
import AuthPanel from "./auth-panel";

export default function MobileMenu({ paletteKey, setPaletteKey, user, auth, provider }) {
        const [open, setOpen] = useState(false);
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
                                        <AuthPanel
                                                user={user}
                                                auth={auth}
                                                provider={provider}
                                        />
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
                                </div>
                        </div>
                </div>
        );
}
