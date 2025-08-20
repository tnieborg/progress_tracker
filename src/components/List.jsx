import React from "react";
import { Card, AddRow } from "./ui";
import "./List.css";

export default function List({
  title,
  type,
  data,
  onAdd,
  onUpdate,
  onDelete,
  paletteKey,
  readOnly,
  goals = [],
  computeDerivedPercent = () => 0,
  pending,
  setPendingValue,
  setDraggingFlag,
  commitSlider,
  onAddGoal,
}) {
  return (
    <Card
      title={title}
      right={readOnly ? (<span className="muted">Read only</span>) : null}
    >
      {!data.length && <div className="list-empty">No items</div>}

      {data.map((item) => {
        const isProgress = type === "progress";
        const isGoals = type === "goals";
        const isPeople = type === "people";

        const colKey = isProgress ? "progress" : isGoals ? "goals" : null;
        const linkedIds = isProgress ? (item.goalIds || []) : [];
        const autoFromGoals = isProgress ? (item.auto ?? false) : false;
        const derived = isProgress ? computeDerivedPercent(linkedIds) : 0;
        const baseLive = isProgress ? (item.value ?? 0) : isGoals ? (item.percent ?? 0) : 0;
        const liveValue = isProgress && autoFromGoals && linkedIds.length ? derived : baseLive;
        const pendingValue = colKey ? pending[colKey][item.id] : undefined;
        const shownValue = pendingValue !== undefined ? pendingValue : liveValue;

        return (
          <div
            key={item.id}
            className={`list-row ${type}`}
          >
            {isProgress && (
              <>
                <span>{item.label}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={shownValue}
                  onChange={(e) => setPendingValue("progress", item.id, Number(e.target.value))}
                  onMouseDown={() => setDraggingFlag("progress", item.id, true)}
                  onTouchStart={() => setDraggingFlag("progress", item.id, true)}
                  onMouseUp={() => commitSlider("progress", item, liveValue)}
                  onTouchEnd={() => commitSlider("progress", item, liveValue)}
                  onBlur={() => commitSlider("progress", item, liveValue)}
                  disabled={readOnly || (autoFromGoals && linkedIds.length > 0)}
                />
                <div className="list-value">
                  {autoFromGoals && linkedIds.length > 0 ? `${derived}% (auto)` : `${shownValue}%`}
                </div>

                <div className="list-row-controls">
                  <label className="list-label-checkbox">
                    <input
                      type="checkbox"
                      checked={autoFromGoals}
                      onChange={(e) => onUpdate(item.id, { auto: e.target.checked })}
                      disabled={readOnly}
                    />
                    Auto from goals
                  </label>
                  <details>
                    <summary className="link-goals-summary">Link goals ({linkedIds.length})</summary>
                    <div className="link-goals-list">
                      {goals.map((g) => {
                        const checked = linkedIds.includes(g.id);
                        return (
                          <label key={g.id} className="link-goals-item">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const next = new Set(linkedIds);
                                if (e.target.checked) next.add(g.id); else next.delete(g.id);
                                onUpdate(item.id, { goalIds: Array.from(next) });
                              }}
                              disabled={readOnly}
                            />
                            <span>{g.title} ({g.percent ?? 0}%)</span>
                          </label>
                        );
                      })}
                      {onAddGoal && (
                        <AddRow
                          type="goals"
                          placeholder="Add a goal"
                          disabled={readOnly}
                          onAdd={(goal) => onAddGoal(item.id, goal)}
                        />
                      )}
                    </div>
                  </details>
                </div>
              </>
            )}

            {isGoals && (
              <>
                <span>{item.title}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={shownValue}
                  onChange={(e) => setPendingValue("goals", item.id, Number(e.target.value))}
                  onMouseDown={() => setDraggingFlag("goals", item.id, true)}
                  onTouchStart={() => setDraggingFlag("goals", item.id, true)}
                  onMouseUp={() => commitSlider("goals", item, liveValue)}
                  onTouchEnd={() => commitSlider("goals", item, liveValue)}
                  onBlur={() => commitSlider("goals", item, liveValue)}
                  disabled={readOnly}
                />
                <div className="list-value">{shownValue}%</div>
              </>
            )}

            {isPeople && (
              <>
                <span>{item.name}</span>
                <select
                  className="status-select"
                  value={item.status || "watching"}
                  onChange={(e) => onUpdate(item.id, { status: e.target.value })}
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

      {!readOnly && (
        <AddRow
          type={type}
          placeholder={type === "people" ? "Add a person/project" : type === "goals" ? "Add a goal" : "Add a progress item"}
          disabled={readOnly}
          onAdd={onAdd}
        />
      )}
    </Card>
  );
}
