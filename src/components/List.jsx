import React from "react";
import { PALETTES, Card, AddRow } from "./ui";

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
  const p = PALETTES[paletteKey];
  return (
    <Card
      palette={paletteKey}
      title={title}
      right={readOnly ? (<span style={{ color: p.text, opacity: 0.6 }}>Read only</span>) : null}
    >
      {!data.length && <div style={{ opacity: 0.7 }}>No items</div>}

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
            style={{
              display: "grid",
              gridTemplateColumns: isPeople ? "1fr minmax(120px,160px) auto" : "1fr minmax(180px,1fr) auto",
              gap: 12,
              alignItems: "center",
              padding: "10px 0",
              borderBottom: `1px dashed ${p.accent}18`,
            }}
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
                <div style={{ textAlign: "right", color: p.accent }}>
                  {autoFromGoals && linkedIds.length > 0 ? `${derived}% (auto)` : `${shownValue}%`}
                </div>

                <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12, alignItems: "center", opacity: 0.9 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={autoFromGoals}
                      onChange={(e) => onUpdate(item.id, { auto: e.target.checked })}
                      disabled={readOnly}
                    />
                    Auto from goals
                  </label>
                  <details>
                    <summary style={{ cursor: "pointer" }}>Link goals ({linkedIds.length})</summary>
                    <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                      {goals.map((g) => {
                        const checked = linkedIds.includes(g.id);
                        return (
                          <label key={g.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                <div style={{ textAlign: "right", color: p.accent }}>{shownValue}%</div>
              </>
            )}

            {isPeople && (
              <>
                <span>{item.name}</span>
                <select
                  value={item.status || "watching"}
                  onChange={(e) => onUpdate(item.id, { status: e.target.value })}
                  disabled={readOnly}
                  style={{
                    background: "transparent",
                    color: p.accent,
                    border: `1px solid ${p.accent}55`,
                    borderRadius: 8,
                    padding: "4px 6px",
                  }}
                >
                  <option value="watching" style={{ color: "#000" }}>watching</option>
                  <option value="ongoing" style={{ color: "#000" }}>ongoing</option>
                  <option value="completed" style={{ color: "#000" }}>completed</option>
                </select>
                {!readOnly && (
                  <button
                    onClick={() => onDelete(item.id)}
                    style={{ color: "#ff4d4f", background: "transparent", border: "1px solid #ff4d4f55", padding: "4px 8px", borderRadius: 8 }}
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
