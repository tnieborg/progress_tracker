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
        onUpdate,
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
                                                }`}
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
                                                                        Delete
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
