import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, GoogleAuthProvider } from "firebase/auth";
import {
        getFirestore,
        collection,
        addDoc,
        updateDoc,
        deleteDoc,
        doc,
        onSnapshot,
        serverTimestamp,
        query,
        where,
        orderBy,
        getDocs,
} from "firebase/firestore";
import { firebaseConfig } from "./firebase-config";
import Header from "./components/header/header";
import ProjectsOverview from "./components/projects-overview/projects-overview";
import GoalsOverview from "./components/goals-overview/goals-overview";
import PeopleOverview from "./components/people-overview/people-overview";
import { PALETTES, Card, Button } from "./components/ui/ui";
import "./App.css";


// ========== Firebase ==========
const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);
const auth = getAuth(fbApp);
const provider = new GoogleAuthProvider();


// ========== Utilities ==========
function useDebouncedCallback(fn, delay = 600) {
	const fnRef = useRef(fn);
	const timer = useRef(null);
	useEffect(() => { fnRef.current = fn; }, [fn]);
	useEffect(() => () => timer.current && clearTimeout(timer.current), []);
	return useCallback((...args) => {
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(() => fnRef.current(...args), delay);
	}, [delay]);
}

function WorkspaceBar({
        workspaces,
        selectedWsId,
        setSelectedWsId,
        createWorkspace,
        deleteWorkspace,
        resetLocal,
        testConnection,
        }) {
        const [name, setName] = useState("");
        return (
                <Card title="Workspaces" right={null}>
                <div className="workspace-bar">
                        <select
                        className="workspace-bar-select"
                        value={selectedWsId || ""}
                        onChange={(e) => setSelectedWsId(e.target.value)}
                        >
                        {workspaces.length === 0 && (
                                <option value="">No workspaces yet</option>
                        )}
                        {workspaces.map((w) => (
                                <option key={w.id} value={w.id}>
                                {w.name || "Untitled"}
                                </option>
                        ))}
                        </select>
                        <Button subtle onClick={resetLocal}>Reset local cache</Button>
                        <Button onClick={testConnection}>Test connection</Button>
                        <Button
                        onClick={() => {
                                if (selectedWsId && window.confirm("Delete this workspace? This will remove all data.")) {
                                        deleteWorkspace(selectedWsId);
                                }
                        }}
                        disabled={!selectedWsId}
                        >
                        Delete workspace
                        </Button>
                </div>

                <div className="workspace-create">
                        <input
                        className="workspace-bar-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="New workspace name"
                        />
                        <Button
                        onClick={async () => {
                                const n = name.trim();
                                if (!n) return;
                                const id = await createWorkspace(n);
                                if (id) setSelectedWsId(id);
                                setName("");
                        }}
                        >
                        Create
                        </Button>
                </div>
                </Card>
        );
}

// ========== Main App ==========
export default function App() {
        const [paletteKey, setPaletteKey] = useState("royalViolet");

	const [user, setUser] = useState(null);
	useEffect(() => {
		const unsub = onAuthStateChanged(auth, setUser);
		return () => unsub();
	}, []);

	const [banner, setBanner] = useState("");

	// workspaces
	const [workspaces, setWorkspaces] = useState([]);
	const [selectedWsId, setSelectedWsId] = useState("");

	// collections
        const [projects, setProjects] = useState([]);
	const [goals, setGoals] = useState([]);
	const [people, setPeople] = useState([]);

	const readOnly = !selectedWsId;

	// load workspaces for the current user
	useEffect(() => {
		if (!user) {
		setWorkspaces([]);
		setSelectedWsId("");
		return;
		}
               const q = query(
               collection(db, "workspaces"),
               where("memberIds", "array-contains", user.uid)
               // NOTE: removed orderBy("createdAt") for now to avoid composite index error.
               // After this works, add it back and follow the console link to create the index.
               );
               const unsub = onSnapshot(
               q,
               (snap) => {
                       const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                       setWorkspaces(list);
                       if (!selectedWsId && list[0]) setSelectedWsId(list[0].id);
               },
               (err) => {
                       console.error("workspace load failed", err);
                       setBanner(`Load workspaces failed: ${err.message}`);
               }
               );
		return () => unsub();
	}, [user]);

	// subscribe to subcollections for selected workspace
	useEffect(() => {
		if (!selectedWsId) {
                setProjects([]); setGoals([]); setPeople([]);
		return;
		}
		const base = doc(db, "workspaces", selectedWsId);

                const unsub1 = onSnapshot(collection(base, "projects"), (snap) =>
                setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
                );
		const unsub2 = onSnapshot(collection(base, "goals"), (snap) =>
		setGoals(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
		);
		const unsub3 = onSnapshot(collection(base, "people"), (snap) =>
		setPeople(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
		);

		return () => { unsub1(); unsub2(); unsub3(); };
	}, [selectedWsId]);

	// helpers
	const getColRef = (colName) => {
		if (!selectedWsId) return null;
		return collection(db, "workspaces", selectedWsId, colName);
	};

        async function addItem(colName, item) {
                const ref = getColRef(colName);
                if (!ref) { setBanner("No workspace selected."); return ""; }
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
		if (!ref) { setBanner("No workspace selected."); return; }
		try {
		await updateDoc(doc(ref, id), patch);
		} catch (err) {
		setBanner(`Update failed: ${err.message}`);
		}
	}
        async function deleteItem(colName, id) {
                const ref = getColRef(colName);
                if (!ref) { setBanner("No workspace selected."); return; }
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

	// Workspace operations
        async function createWorkspace(name) {
		if (!auth.currentUser) {
			setBanner("Please sign in to create a workspace.");
			return "";
		}
		// prepare temp id outside try/catch so we can clean it up on failure
		const tempId = "temp-" + Math.random().toString(36).slice(2);
		try {
			const uid = auth.currentUser.uid;
			const wsRef = collection(db, "workspaces");

			// Optimistically add a temporary option so the <select> isn't blank
			setWorkspaces((prev) => [
				...prev,
				{ id: tempId, name, members: { [uid]: "owner" }, memberIds: [uid], createdAt: new Date() }
			]);
			setSelectedWsId(tempId);

			// Write a workspace that satisfies your rules
			const d = await addDoc(collection(db, "workspaces"), {
				name,
				createdAt: serverTimestamp(),
				createdBy: uid,
				members: { [uid]: "owner" },
				memberIds: [uid],
			});


			// Switch the select to the real id and replace temp entry
			setSelectedWsId(d.id);
			setWorkspaces((prev) => prev.map((w) => (w.id === tempId ? { ...w, id: d.id } : w)));
			setBanner(`Created workspace “${name}”.`);
			return d.id;
		} catch (err) {
			// Remove the temporary entry on failure
			setWorkspaces((prev) => prev.filter((w) => w.id !== tempId));
			setBanner(`Create workspace failed: ${err.message}`);
			return "";
		}
        }


        async function deleteWorkspace(id) {
                try {
                        const wsRef = doc(db, "workspaces", id);
                        const subcols = ["projects", "goals", "people"];
                        for (const c of subcols) {
                                const snap = await getDocs(collection(wsRef, c));
                                await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
                        }
                        await deleteDoc(wsRef);
                        if (selectedWsId === id) setSelectedWsId("");
                        setBanner("Workspace deleted.");
                } catch (err) {
                        setBanner(`Delete workspace failed: ${err.message}`);
                }
        }


        async function updateWorkspaceMembers(id, members) {
                try {
                        await updateDoc(doc(db, "workspaces", id), {
                        members,
			memberIds: Object.keys(members),
			});
		} catch (err) {
			setBanner(`Update members failed: ${err.message}`);
		}
	}

	function resetLocal() {
		setBanner("Local cache cleared.");
		setSelectedWsId((cur) => {
		const next = cur;
		setSelectedWsId("");
		setTimeout(() => setSelectedWsId(next), 0);
		return cur;
		});
	}

	// Test connection (permissions probe within selected workspace)
	async function testConnection() {
		if (!selectedWsId) { setBanner("No workspace selected."); return; }
		try {
		const base = doc(db, "workspaces", selectedWsId);
		const pingCol = collection(base, "__ping");
		const added = await addDoc(pingCol, { t: Date.now() });
		await deleteDoc(doc(pingCol, added.id));
		setBanner("✅ Connection OK: rules permit read/write in this workspace.");
		} catch (err) {
		setBanner(`❌ Test failed: ${err.message}`);
		}
	}

	// Debounced slider persist + optimistic values (simplified and robust)
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

        // Build a goals index for derived project percent
	const goalsById = useMemo(() => {
		const m = Object.create(null);
		for (const g of goals) m[g.id] = g;
		return m;
	}, [goals]);

	function computeDerivedPercent(goalIds = []) {
		const arr = goalIds.map((id) => (goalsById[id]?.percent ?? 0));
		if (!arr.length) return 0;
		const sum = arr.reduce((a, b) => a + b, 0);
		return Math.round(sum / arr.length);
	}

        const commitSlider = useCallback((type, item, liveValue) => {
                const col = type;
                const id = item.id;
                const pendingValue = pending[type]?.[id];
                const finalValue = pendingValue ?? liveValue ?? 0;
                if (type === "projects") debouncedPersist("projects", id, { percent: Number(finalValue) });
                if (type === "goals") debouncedPersist("goals", id, { percent: Number(finalValue) });
                clearPendingValue(type, id);
                setDraggingFlag(type, id, false);
        }, [pending, debouncedPersist, clearPendingValue, setDraggingFlag]);

        return (
                <div className={`app palette-${paletteKey}`}>
                <div className="container">
                        <Header paletteKey={paletteKey} setPaletteKey={setPaletteKey} user={user} auth={auth} provider={provider} />

                        {banner && (
                        <div className="banner">{banner}</div>
                        )}

                        <WorkspaceBar
                        workspaces={workspaces}
                        selectedWsId={selectedWsId}
                        setSelectedWsId={setSelectedWsId}
                        createWorkspace={createWorkspace}
                        deleteWorkspace={deleteWorkspace}
                        resetLocal={resetLocal}
                        testConnection={testConnection}
                        />

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
                        <small>Palette: <span>{PALETTES[paletteKey].name}</span></small>
                        </div>
                </div>
                </div>
        );
}
