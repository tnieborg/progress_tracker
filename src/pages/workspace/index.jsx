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
        query,
        where,
        getDocs,
        getDoc,
        arrayUnion,
        arrayRemove,
        deleteField,
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import ProjectsOverview from "../../components/projects-overview/projects-overview";
import PeopleOverview from "../../components/people-overview/people-overview";
import List from "../../components/list/list";
import Tabs from "../../components/tabs/tabs";
import { PALETTES, Card } from "../../components/ui/ui";
import "./workspace.css";

export default function WorkspacePage({ paletteKey, setPaletteKey, setBanner }) {
        const { id: wsId } = useParams();
        const [projects, setProjects] = useState([]);
        const [people, setPeople] = useState([]);
        const [projectGoals, setProjectGoals] = useState({});
        const [selectedProjectId, setSelectedProjectId] = useState("");
        const [activeTab, setActiveTab] = useState("projects");
        const [role, setRole] = useState("collaborator");

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
                        if (data?.members && auth.currentUser) {
                                setRole(data.members[auth.currentUser.uid] || "collaborator");
                        }
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

        const getColRef = (colName) => {
                if (!wsId) return null;
                return collection(db, "workspaces", wsId, colName);
        };

        const getGoalsRef = (projectId) => {
                if (!wsId || !projectId) return null;
                return collection(db, "workspaces", wsId, "projects", projectId, "goals");
        };

        const isOwner = role === "owner";
        const isAdmin = role === "admin";
        const isEditor = role === "editor";

        const canManageUsers = isOwner || isAdmin;
        const canAddProject = isOwner || isAdmin;
        const canDeleteProject = isOwner || isAdmin;
        const canAddGoal = isOwner || isAdmin || isEditor;
        const canDeleteGoal = isOwner || isAdmin || isEditor;
        const canEditGoal = canAddGoal || role === "collaborator";

        const projectReadOnly = !wsId || !(canAddProject || canDeleteProject);
        const goalReadOnly = !wsId || !canEditGoal;
        const peopleReadOnly = !wsId || !canManageUsers;

        async function addItem(colName, item) {
                const ref = getColRef(colName);
                if (!ref) {
                        setBanner("No workspace selected.");
                        return "";
                }
                try {
                        if (colName === "people") {
                                const email = item.email.toLowerCase();
                                const q = query(
                                        collection(db, "profiles"),
                                        where("email", "==", email),
                                );
                                const snap = await getDocs(q);
                                if (snap.empty) {
                                        setBanner("User not found");
                                        return "";
                                }
                                const uid = snap.docs[0].id;
                                const role = item.role || "collaborator";
                                const wsRef = doc(db, "workspaces", wsId);
                                await updateDoc(wsRef, {
                                        [`members.${uid}`]: role,
                                        memberIds: arrayUnion(uid),
                                });
                                const d = await addDoc(ref, {
                                        ...item,
                                        email,
                                        uid,
                                        role,
                                        createdAt: serverTimestamp(),
                                });
                                return d.id;
                        }

                        const d = await addDoc(ref, {
                                ...item,
                                createdAt: serverTimestamp(),
                        });
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
                        if (colName === "people" && patch.role) {
                                const snap = await getDoc(doc(ref, id));
                                const uid = snap.data().uid;
                                const wsRef = doc(db, "workspaces", wsId);
                                await updateDoc(wsRef, { [`members.${uid}`]: patch.role });
                        }
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
                        if (colName === "people") {
                                const snap = await getDoc(doc(ref, id));
                                const uid = snap.data().uid;
                                const wsRef = doc(db, "workspaces", wsId);
                                await updateDoc(wsRef, {
                                        [`members.${uid}`]: deleteField(),
                                        memberIds: arrayRemove(uid),
                                });
                        }
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
                        const d = await addDoc(ref, {
                                ...goal,
                                assigneeUid: goal.assigneeUid || "",
                                notes: goal.notes || "",
                                createdAt: serverTimestamp(),
                        });
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
                <div className="workspace-page">

                        <Tabs
                                activeTab={activeTab}
                                onTabChange={setActiveTab}
                                tabs={[
                                        {
                                                id: "projects",
                                                label: "Projects",
                                                content: (
                                                        <div className="projects-view">
                                                                <div className="projects-sidebar">
                                                                        <ProjectsOverview
                                                                                paletteKey={paletteKey}
                                                                                data={projects}
                                                                                onAdd={(item) => addItem("projects", item)}
                                                                                onUpdate={(id, patch) => updateItem("projects", id, patch)}
                                                                                onDelete={(id) => deleteItem("projects", id)}
                                                                                readOnly={projectReadOnly}
                                                                                canAdd={canAddProject}
                                                                                canDelete={canDeleteProject}
                                                                                computeDerivedPercent={computeDerivedPercent}
                                                                                selectedId={selectedProjectId}
                                                                                onSelectItem={(id) => setSelectedProjectId(id)}
                                                                        />
                                                                </div>
                                                                <div className="goals-pane">
                                                                        {selectedProjectId ? (
                                                                                <List
                                                                                        title="Goals"
                                                                                        type="goals"
                                                                                        data={projectGoals[selectedProjectId] || []}
                                                                                        onAdd={(item) => addGoalToProject(selectedProjectId, item)}
                                                                                        onUpdate={(id, patch) => updateGoal(selectedProjectId, id, patch)}
                                                                                        onDelete={(id) => deleteGoal(selectedProjectId, id)}
                                                                                        readOnly={goalReadOnly}
                                                                                        canAdd={canAddGoal}
                                                                                        canDelete={canDeleteGoal}
                                                                                        people={people}
                                                                                        userRole={role}
                                                                                />
                                                                        ) : (
                                                                                <Card title="Goals">
                                                                                        <div className="list-empty">
                                                                                                Select a project to view goals
                                                                                        </div>
                                                                                </Card>
                                                                        )}
                                                                </div>
                                                        </div>
                                                ),
                                        },
                                        {
                                                id: "people",
                                                label: "People",
                                                content: (
                                                        <PeopleOverview
                                                                paletteKey={paletteKey}
                                                                data={people}
                                                                onAdd={(item) => addItem("people", item)}
                                                                onUpdate={(id, patch) => updateItem("people", id, patch)}
                                                                onDelete={(id) => deleteItem("people", id)}
                                                                readOnly={peopleReadOnly}
                                                                canAdd={canManageUsers}
                                                                canDelete={canManageUsers}
                                                        />
                                                ),
                                        },
                                ]}
                        />
                        
                        <div className="palette-info">
                                <small>
                                        Palette: <span>{PALETTES[paletteKey].name}</span>
                                </small>
                        </div>
                </div>
        );
}

