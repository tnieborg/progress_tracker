import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
        collection,
        addDoc,
        updateDoc,
        deleteDoc,
        doc,
        onSnapshot,
        serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import ProjectsOverview from "./components/projects-overview/projects-overview";
import GoalsOverview from "./components/goals-overview/goals-overview";
import PeopleOverview from "./components/people-overview/people-overview";
import { PALETTES } from "./components/ui/ui";

function useDebouncedCallback(fn, delay = 600) {
        const fnRef = useRef(fn);
        const timer = useRef(null);
        useEffect(() => {
                fnRef.current = fn;
        }, [fn]);
        useEffect(() => () => timer.current && clearTimeout(timer.current), []);
        return useCallback(
                (...args) => {
                        if (timer.current) clearTimeout(timer.current);
                        timer.current = setTimeout(() => fnRef.current(...args), delay);
                },
                [delay],
        );
}

export default function WorkspacePage({ paletteKey, setPaletteKey, setBanner }) {
        const { id: wsId } = useParams();
        const [projects, setProjects] = useState([]);
        const [goals, setGoals] = useState([]);
        const [people, setPeople] = useState([]);

        useEffect(() => {
                if (!wsId) {
                        setProjects([]);
                        setGoals([]);
                        setPeople([]);
                        return;
                }
                const base = doc(db, "workspaces", wsId);
                const unsubWs = onSnapshot(base, (snap) => {
                        const data = snap.data();
                        if (data?.paletteKey) setPaletteKey(data.paletteKey);
                });
                const unsub1 = onSnapshot(collection(base, "projects"), (snap) =>
                        setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
                );
                const unsub2 = onSnapshot(collection(base, "goals"), (snap) =>
                        setGoals(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
                );
                const unsub3 = onSnapshot(collection(base, "people"), (snap) =>
                        setPeople(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
                );
                return () => {
                        unsubWs();
                        unsub1();
                        unsub2();
                        unsub3();
                };
        }, [wsId, setPaletteKey]);

        const readOnly = !wsId;

        const getColRef = (colName) => {
                if (!wsId) return null;
                return collection(db, "workspaces", wsId, colName);
        };

        async function addItem(colName, item) {
                const ref = getColRef(colName);
                if (!ref) {
                        setBanner("No workspace selected.");
                        return "";
                }
                try {
                        const d = await addDoc(ref, { ...item, createdAt: serverTimestamp() });
                        return d.id;
                } catch (err) {
                        setBanner(`Add failed: ${err.message}`);
                        return "";
                }
        }

        async function updateItem(colName, id, patch) {
                const ref = getColRef(colName);
                if (!ref) {
                        setBanner("No workspace selected.");
                        return;
                }
                try {
                        await updateDoc(doc(ref, id), patch);
                } catch (err) {
                        setBanner(`Update failed: ${err.message}`);
                }
        }
        async function deleteItem(colName, id) {
                const ref = getColRef(colName);
                if (!ref) {
                        setBanner("No workspace selected.");
                        return;
                }
                try {
                        await deleteDoc(doc(ref, id));
                } catch (err) {
                        setBanner(`Delete failed: ${err.message}`);
                }
        }

        async function addGoalToProject(projectId, goal) {
                const id = await addItem("goals", goal);
                if (!id) return;
                const current = projects.find((p) => p.id === projectId)?.goalIds || [];
                updateItem("projects", projectId, { goalIds: [...current, id] });
        }

        const debouncedPersist = useDebouncedCallback((col, id, patch) => {
                updateItem(col, id, patch);
        }, 600);

        const [pending, setPending] = useState({ projects: {}, goals: {} });
        const [dragging, setDragging] = useState({ projects: {}, goals: {} });

        const setPendingValue = useCallback((col, id, value) => {
                setPending((p) => ({ ...p, [col]: { ...p[col], [id]: value } }));
        }, []);

        const clearPendingValue = useCallback((col, id) => {
                setPending((p) => {
                        const copy = { ...p[col] };
                        delete copy[id];
                        return { ...p, [col]: copy };
                });
        }, []);

        const setDraggingFlag = useCallback((col, id, val) => {
                setDragging((d) => ({ ...d, [col]: { ...d[col], [id]: val } }));
        }, []);

        const goalsById = useMemo(() => {
                const m = Object.create(null);
                for (const g of goals) m[g.id] = g;
                return m;
        }, [goals]);

        function computeDerivedPercent(goalIds = []) {
                const arr = goalIds.map((id) => goalsById[id]?.percent ?? 0);
                if (!arr.length) return 0;
                const sum = arr.reduce((a, b) => a + b, 0);
                return Math.round(sum / arr.length);
        }

        const commitSlider = useCallback(
                (type, item, liveValue) => {
                        const col = type;
                        const id = item.id;
                        const pendingValue = pending[type]?.[id];
                        const finalValue = pendingValue ?? liveValue ?? 0;
                        if (type === "projects")
                                debouncedPersist("projects", id, { percent: Number(finalValue) });
                        if (type === "goals")
                                debouncedPersist("goals", id, { percent: Number(finalValue) });
                        clearPendingValue(type, id);
                        setDraggingFlag(type, id, false);
                },
                [pending, debouncedPersist, clearPendingValue, setDraggingFlag],
        );

        return (
                <>
                        <div className="grid-wrap">
                                <ProjectsOverview
                                        paletteKey={paletteKey}
                                        data={projects}
                                        goals={goals}
                                        onAdd={(item) => addItem("projects", item)}
                                        onUpdate={(id, patch) => updateItem("projects", id, patch)}
                                        onDelete={(id) => deleteItem("projects", id)}
                                        readOnly={readOnly}
                                        computeDerivedPercent={computeDerivedPercent}
                                        pending={pending}
                                        setPendingValue={setPendingValue}
                                        setDraggingFlag={setDraggingFlag}
                                        commitSlider={commitSlider}
                                        onAddGoal={addGoalToProject}
                                />
                                <GoalsOverview
                                        paletteKey={paletteKey}
                                        data={goals}
                                        onAdd={(item) => addItem("goals", item)}
                                        onUpdate={(id, patch) => updateItem("goals", id, patch)}
                                        onDelete={(id) => deleteItem("goals", id)}
                                        readOnly={readOnly}
                                        pending={pending}
                                        setPendingValue={setPendingValue}
                                        setDraggingFlag={setDraggingFlag}
                                        commitSlider={commitSlider}
                                />
                                <PeopleOverview
                                        paletteKey={paletteKey}
                                        data={people}
                                        onAdd={(item) => addItem("people", item)}
                                        onUpdate={(id, patch) => updateItem("people", id, patch)}
                                        onDelete={(id) => deleteItem("people", id)}
                                        readOnly={readOnly}
                                        pending={pending}
                                        setPendingValue={setPendingValue}
                                        setDraggingFlag={setDraggingFlag}
                                        commitSlider={commitSlider}
                                />
                        </div>

                        <div className="palette-info">
                                <small>
                                        Palette: <span>{PALETTES[paletteKey].name}</span>
                                </small>
                        </div>
                </>
        );
}

