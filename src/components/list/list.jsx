import React from "react";
import { Card, AddRow } from "../ui/ui";
import "./list.css";

export default function List({
        title,
        type,
        data,
        onAdd,
        onUpdate,
        onDelete,
        paletteKey,
        readOnly,
        computeDerivedPercent = () => ({ percent: 0, count: 0 }),
        onSelectItem,
        selectedId,
        children,
}) {
        return (
                <Card
                        title={title}
                        right={readOnly ? <span className="muted">Read only</span> : null}
                >
                        {!data.length && <div className="list-empty">No items</div>}

                        {data.map((item) => {
                                const isProjects = type === "projects";
                                const isGoals = type === "goals";
                                const isPeople = type === "people";

                                const { percent: derived } = isProjects
                                        ? computeDerivedPercent(item.id)
                                        : { percent: 0 };

                                return (
                                        <div
                                                key={item.id}
                                                className={`list-row ${type} ${
                                                        isGoals && item.status ? `goal-${item.status}` : ""
                                                } ${selectedId === item.id ? "selected" : ""}`}
                                                onClick={() => onSelectItem && onSelectItem(item.id)}
                                        >
                                                {isProjects && (
                                                        <>
                                                                <span>{item.name}</span>
                                                                <div className="list-actions">
                                                                        <div className="list-value">{derived}%</div>
                                                                        {!readOnly && (
                                                                                <button
                                                                                        onClick={() => onDelete(item.id)}
                                                                                        className="delete-button"
                                                                                >
                                                                                        Delete
                                                                                </button>
                                                                        )}
                                                                </div>
                                                        </>
                                                )}

                                                {isGoals && (
                                                        <>
                                                                <span>{item.title}</span>
                                                                <select
                                                                        className="status-select"
                                                                        value={item.status || "todo"}
                                                                        onChange={(e) =>
                                                                                onUpdate(item.id, {
                                                                                        status: e.target.value,
                                                                                })
                                                                        }
                                                                        disabled={readOnly}
                                                                >
                                                                        <option value="todo">To do</option>
                                                                        <option value="doing">Doing</option>
                                                                        <option value="done">Done</option>
                                                                </select>
                                                                {!readOnly && (
                                                                        <button
                                                                                onClick={() => onDelete(item.id)}
                                                                                className="delete-button"
                                                                        >
                                                                                Delete
                                                                        </button>
                                                                )}
                                                        </>
                                                )}

                                                {isPeople && (
                                                        <>
                                                                <span>
                                                                        {item.name || item.email}
                                                                        {item.name && item.email ? ` (${item.email})` : ""}
                                                                </span>
                                                                <select
                                                                        className="status-select"
                                                                        value={item.status || "watching"}
                                                                        onChange={(e) =>
                                                                                onUpdate(item.id, {
                                                                                        status: e.target.value,
                                                                                })
                                                                        }
                                                                        disabled={readOnly}
                                                                >
                                                                        <option value="watching">watching</option>
                                                                        <option value="ongoing">ongoing</option>
                                                                        <option value="completed">completed</option>
                                                                </select>
                                                                {!readOnly && (
                                                                        <button
                                                                                onClick={() => onDelete(item.id)}
                                                                                className="delete-button"
                                                                        >
                                                                                Delete
                                                                        </button>
                                                                )}
                                                        </>
                                                )}
                                        </div>
                                );
                        })}
                        {!readOnly && type !== "people" && (
                                <AddRow
                                        type={type}
                                        placeholder={
                                                type === "goals"
                                                        ? "Add a goal"
                                                        : "Add a project"
                                        }
                                        disabled={readOnly}
                                        onAdd={onAdd}
                                />
                        )}

                        {children}
                </Card>
        );
}
