import React, { useEffect, useState } from "react";
import { Card, AddRow } from "../ui/ui";
import "./projects-overview.css";

export default function ProjectsOverview({
        data,
        onAdd,
        onDelete,
        readOnly,
        canAdd = true,
        canDelete = true,
        computeDerivedPercent = () => ({ percent: 0 }),
        selectedId,
        onSelectItem,
}) {
        const [isMobile, setIsMobile] = useState(false);

        useEffect(() => {
                const handleResize = () => setIsMobile(window.innerWidth <= 640);
                handleResize();
                window.addEventListener("resize", handleResize);
                return () => window.removeEventListener("resize", handleResize);
        }, []);

        const handleSelectChange = (e) => {
                onSelectItem && onSelectItem(e.target.value);
        };

        const handleRowClick = (id) => {
                if (!onSelectItem) return;
                onSelectItem(selectedId === id ? "" : id);
        };

        return (
                <Card
                        title="Projects"
                        right={readOnly ? <span className="muted">Read only</span> : null}
                >
                        {!data.length && <div className="projects-empty">No projects</div>}

                        {isMobile ? (
                                data.length > 0 && (
                                        <select
                                                className="project-select"
                                                value={selectedId || ""}
                                                onChange={handleSelectChange}
                                        >
                                                <option value="">Select a project</option>
                                                {data.map((item) => (
                                                        <option key={item.id} value={item.id}>
                                                                {item.name}
                                                        </option>
                                                ))}
                                        </select>
                                )
                        ) : (
                                data.map((item) => (
                                        <div
                                                key={item.id}
                                                className={`project-row ${
                                                        selectedId === item.id ? "selected" : ""
                                                } ${onSelectItem ? "clickable" : ""}`}
                                                onClick={() => handleRowClick(item.id)}
                                        >
                                                <span>{item.name}</span>
                                                <div className="project-actions">
                                                        <div className="project-progress">
                                                                {computeDerivedPercent(item.id).percent}%
                                                        </div>
                                                        {!readOnly && canDelete && (
                                                                <button
                                                                        onClick={() => onDelete(item.id)}
                                                                        className="delete-button"
                                                                >
                                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Delete" role="img"><path d="M6 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2"/><path d="M7 7l1 12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-12" stroke="currentColor" stroke-width="2"/></svg>
                                                                </button>
                                                        )}
                                                </div>
                                        </div>
                                ))
                        )}

                        {!readOnly && canAdd && (
                                <AddRow
                                        type="projects"
                                        placeholder="Add a project"
                                        onAdd={onAdd}
                                        disabled={readOnly}
                                />
                        )}
                </Card>
        );
}
