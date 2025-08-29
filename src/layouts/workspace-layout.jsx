import React from "react";
import { Outlet } from "react-router-dom";
import { Card } from "../components/ui/ui";

function WorkspaceNav({
  workspaces,
  currentWsId,
  currentUser,
  createWorkspace,
  deleteWorkspace,
  resetLocal,
  testConnection,
}) {
  const [name, setName] = React.useState("");
  const current = workspaces.find((w) => w.id === currentWsId);
  const role = current?.members?.[currentUser?.uid];
  return (
    <div className="workspace-nav"> 
      <Card title="Workspaces" right={null}>
        <div className="workspace-bar">
          {workspaces.length === 0 && <span>No workspaces yet</span>}
          {workspaces.map((w) => (
            <a key={w.id} href={`/workspace/${w.id}`} className={w.id === currentWsId ? "workspace-link active" : "workspace-link"}>
              {w.name || "Untitled"}
            </a>
          ))}
          <button className="btn btn-subtle" onClick={resetLocal}>Reset local cache</button>
          <button className="btn" onClick={testConnection}>Test connection</button>
          <button
            className="btn"
            onClick={() => {
              if (currentWsId && window.confirm("Delete this workspace? This will remove all data.")) {
                deleteWorkspace(currentWsId);
              }
            }}
            disabled={!currentWsId || role !== "owner"}
          >
            Delete workspace
          </button>
        </div>

        <div className="workspace-create">
          <input
            className="workspace-bar-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New workspace name"
          />
          <button
            className="btn"
            onClick={async () => {
              const n = name.trim();
              if (!n) return;
              await createWorkspace(n);
              setName("");
            }}
          >
            Create
          </button>
        </div>
      </Card>
    </div>
  );
}

export default function WorkspaceLayout(props) {
  return (
    <>
      <WorkspaceNav {...props} />
      <Outlet />
    </>
  );
}

