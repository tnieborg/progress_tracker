import React, { useEffect, useState } from "react";
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
import PeopleOverview from "./components/people-overview/people-overview";
import List from "./components/list/list";
import { PALETTES, Card } from "./components/ui/ui";

export default function WorkspacePage({ paletteKey, setPaletteKey, setBanner }) {
        const { id: wsId } = useParams();
        const [projects, setProjects] = useState([]);
        const [people, setPeople] = useState([]);
        const [projectGoals, setProjectGoals] = useState({});
        const [selectedProjectId, setSelectedProjectId] = useState("");

        useEffect(() => {
                if (!wsId) {
                        setProjects([]);
                        setPeople([]);
                        setProjectGoals({});
                        return;
                }
                const base = doc(db, "workspaces", wsId);
                const unsubWs = onSnapshot(base, (snap) => {
                        const data = snap.data();
                        if (data?.paletteKey) setPaletteKey(data.paletteKey);
                });
                const unsubProjects = onSnapshot(collection(base, "projects"), (snap) =>
                        setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
                );
                const unsubPeople = onSnapshot(collection(base, "people"), (snap) =>
                        setPeople(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
                );
                return () => {
                        unsubWs();
                        unsubProjects();
                        unsubPeople();
                };
        }, [wsId, setPaletteKey]);

        useEffect(() => {
                if (!wsId) return;
                const base = doc(db, "workspaces", wsId);
                const unsubs = projects.map((p) =>
                        onSnapshot(collection(base, "projects", p.id, "goals"), (snap) => {
                                setProjectGoals((prev) => ({
                                        ...prev,
                                        [p.id]: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
                                }));
                        }),
                );
                return () => unsubs.forEach((u) => u());
        }, [wsId, projects]);

        const readOnly = !wsId;

        const getColRef = (colName) => {
                if (!wsId) return null;
                return collection(db, "workspaces", wsId, colName);
        };

        const getGoalsRef = (projectId) => {
                if (!wsId || !projectId) return null;
                return collection(db, "workspaces", wsId, "projects", projectId, "goals");
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
                        if (err.code !== "not-found") {
                                setBanner(`Update failed: ${err.message}`);
                        }
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
                const ref = getGoalsRef(projectId);
                if (!ref) {
                        setBanner("No project selected.");
                        return "";
                }
                try {
                        const d = await addDoc(ref, { ...goal, createdAt: serverTimestamp() });
                        return d.id;
                } catch (err) {
                        setBanner(`Add goal failed: ${err.message}`);
                        return "";
                }
        }

        async function updateGoal(projectId, id, patch) {
                const ref = getGoalsRef(projectId);
                if (!ref) {
                        setBanner("No project selected.");
                        return;
                }
                try {
                        await updateDoc(doc(ref, id), patch);
                } catch (err) {
                        if (err.code !== "not-found") {
                                setBanner(`Update goal failed: ${err.message}`);
                        }
                }
        }

        async function deleteGoal(projectId, id) {
                const ref = getGoalsRef(projectId);
                if (!ref) {
                        setBanner("No project selected.");
                        return;
                }
                try {
                        await deleteDoc(doc(ref, id));
                } catch (err) {
                        setBanner(`Delete goal failed: ${err.message}`);
                }
        }

        function computeDerivedPercent(projectId) {
                const arr =
                        projectGoals[projectId]?.map((g) => {
                                if (g.status === "done") return 100;
                                if (g.status === "doing") return 50;
                                return 0;
                        }) || [];
                if (!arr.length) return { percent: 0, count: 0 };
                const sum = arr.reduce((a, b) => a + b, 0);
                return { percent: Math.round(sum / arr.length), count: arr.length };
        }

        useEffect(() => {
                projects.forEach((p) => {
                        const { percent } = computeDerivedPercent(p.id);
                        if (p.percent !== percent) {
                                updateItem("projects", p.id, { percent });
                        }
                });
        }, [projects, projectGoals]);

        return (
                <>
                        <div className="grid-wrap">
                                <ProjectsOverview
                                        paletteKey={paletteKey}
                                        data={projects}
                                        onAdd={(item) => addItem("projects", item)}
                                        onUpdate={(id, patch) => updateItem("projects", id, patch)}
                                        onDelete={(id) => deleteItem("projects", id)}
                                        readOnly={readOnly}
                                        computeDerivedPercent={computeDerivedPercent}
                                        selectedId={selectedProjectId}
                                        onSelectItem={(id) =>
                                                setSelectedProjectId((prev) =>
                                                        prev === id ? "" : id,
                                                )
                                        }
                                />

                                {selectedProjectId ? (
                                        <List
                                                title="Goals"
                                                type="goals"
                                                data={projectGoals[selectedProjectId] || []}
                                                onAdd={(item) => addGoalToProject(selectedProjectId, item)}
                                                onUpdate={(id, patch) => updateGoal(selectedProjectId, id, patch)}
                                                onDelete={(id) => deleteGoal(selectedProjectId, id)}
                                                readOnly={readOnly}
                                        />
                                ) : (
                                        <Card title="Goals">
                                                <div className="list-empty">Select a project to view goals</div>
                                        </Card>
                                )}

                                <PeopleOverview
                                        paletteKey={paletteKey}
                                        data={people}
                                        onAdd={(item) => addItem("people", item)}
                                        onUpdate={(id, patch) => updateItem("people", id, patch)}
                                        onDelete={(id) => deleteItem("people", id)}
                                        readOnly={readOnly}
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

