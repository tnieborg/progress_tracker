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
        canAdd = true,
        canDelete = true,
        computeDerivedPercent = () => ({ percent: 0, count: 0 }),
        onSelectItem,
        selectedId,
        people = [],
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
                                                                        {!readOnly && canDelete && (
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
                                                                <span>
                                                                        {item.title}
                                                                        {(() => {
                                                                                const assignee = people.find(
                                                                                        (p) =>
                                                                                                p.uid ===
                                                                                                item.assigneeUid,
                                                                                );
                                                                                if (!assignee) return null;
                                                                                const label =
                                                                                        assignee.name ||
                                                                                        (assignee.email || "")
                                                                                                .split("@")[0]
                                                                                                .split(" ")
                                                                                                .map((s) => s[0])
                                                                                                .join("")
                                                                                                .toUpperCase();
                                                                                return (
                                                                                        <span className="goal-assignee">
                                                                                                {label}
                                                                                        </span>
                                                                                );
                                                                        })()}
                                                                </span>
                                                                <select
                                                                        className="status-select"
                                                                        value={item.assigneeUid || ""}
                                                                        onChange={(e) =>
                                                                                onUpdate(item.id, {
                                                                                        assigneeUid:
                                                                                                e.target
                                                                                                        .value,
                                                                                })
                                                                        }
                                                                        disabled={readOnly}
                                                                >
                                                                        <option value="">Unassigned</option>
                                                                        {people.map((p) => (
                                                                                <option
                                                                                        key={p.uid}
                                                                                        value={p.uid}
                                                                                >
                                                                                        {p.name || p.email}
                                                                                </option>
                                                                        ))}
                                                                </select>
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
                                                                {!readOnly && canDelete && (
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
                                                                        value={item.role || "collaborator"}
                                                                        onChange={(e) =>
                                                                                onUpdate(item.id, {
                                                                                        role: e.target.value,
                                                                                })
                                                                        }
                                                                        disabled={readOnly || item.role === "owner"}
                                                                >
                                                                        <option value="admin">admin</option>
                                                                        <option value="editor">editor</option>
                                                                        <option value="collaborator">collaborator</option>
                                                                </select>
                                                                {!readOnly && canDelete && item.role !== "owner" && (
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
                        {!readOnly && canAdd && type !== "people" && (
                                <AddRow
                                        type={type}
                                        placeholder={
                                                type === "goals"
                                                        ? "Add a goal"
                                                        : "Add a project"
                                        }
                                        disabled={readOnly}
                                        onAdd={onAdd}
                                        people={people}
                                />
                        )}

                        {children}
                </Card>
        );
}
