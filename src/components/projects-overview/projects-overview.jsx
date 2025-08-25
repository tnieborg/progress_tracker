import React from "react";
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
        return (
                <Card
                        title="Projects"
                        right={readOnly ? <span className="muted">Read only</span> : null}
                >
                        {!data.length && <div className="projects-empty">No projects</div>}

                        {data.map((item) => (
                                <div
                                        key={item.id}
                                        className={`project-row ${
                                                selectedId === item.id ? "selected" : ""
                                        }`}
                                        onClick={() => onSelectItem && onSelectItem(item.id)}
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
                        ))}

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
