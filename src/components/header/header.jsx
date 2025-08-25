import React from "react";
import { PALETTES } from "../ui/ui";
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
        return (
                <div className="header">
                        <h2 className="header-title">Project Tracker</h2>
                        <div className="header-controls">
				<AuthPanel user={user} auth={auth} />
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
                        {showWorkspaceMenu && (
                                <MobileMenu
                                        paletteKey={paletteKey}
                                        setPaletteKey={setPaletteKey}
                                        user={user}
                                        auth={auth}
                                        workspaces={workspaces}
                                        currentWsId={currentWsId}
                                        createWorkspace={createWorkspace}
                                />
                        )}
                </div>
        );
}
