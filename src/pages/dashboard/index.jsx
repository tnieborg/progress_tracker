import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, Button } from "../../components/ui/ui";

export default function Dashboard({ workspaces, createWorkspace }) {
        const [name, setName] = useState("");
        return (
                <div className="dashboard-page">
                        <Card title="Welcome" right={null}>
                                <p>Welcome to Project Tracker!</p>
                                <p>Track projects and collaborate across workspaces.</p>
                        </Card>
                        <Card title="Your Workspaces" right={null}>
                                {workspaces.length === 0 && <p>No workspaces yet.</p>}
                                <ul>
                                        {workspaces.map((w) => (
                                                <li key={w.id}>
                                                        <Link to={`/workspace/${w.id}`}>
                                                                {w.name || "Untitled"}
                                                        </Link>
                                                </li>
                                        ))}
                                </ul>
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

