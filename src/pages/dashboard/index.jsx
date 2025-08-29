import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, Button } from "../../components/ui/ui";
import "./dashboard.css";

export default function Dashboard({ workspaces, createWorkspace }) {
        const [name, setName] = useState("");
        return (
                <div className="dashboard-page">
                        <Card title="Welcome" right={null}>
                                <p>Welcome to Project Tracker!</p>
                                <p>Track projects and collaborate across workspaces.</p>
                        </Card>
                        <Card title="Your Workspaces" right={null}>
                                {workspaces.length === 0 ? (
                                        <div className="empty-state">No workspaces yet. Create your first one below.</div>
                                ) : (
                                        <div className="workspaces-grid">
                                                {workspaces.map((w) => (
                                                        <Link key={w.id} className="workspace-tile" to={`/workspace/${w.id}`}>
                                                                <div className="workspace-name">{w.name || "Untitled"}</div>
                                                        </Link>
                                                ))}
                                        </div>
                                )}
                                <div className="workspace-create">
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
                                                }}
                                        >
                                                Create workspace
                                        </Button>
                                </div>
                        </Card>
                </div>
        );
}

