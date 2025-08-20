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
} from "firebase/firestore";
import { firebaseConfig } from "./firebase-config";
import Header from "./components/Header";
import ProgressOverview from "./components/ProgressOverview";
import GoalsOverview from "./components/GoalsOverview";
import PeopleOverview from "./components/PeopleOverview";
import { PALETTES, Card, Button } from "./components/ui";


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
        paletteKey,
        workspaces,
        selectedWsId,
	setSelectedWsId,
	createWorkspace,
	resetLocal,
	testConnection,
	}) {
	const p = PALETTES[paletteKey];
	const [name, setName] = useState("");
	return (
		<Card palette={paletteKey} title="Workspaces" right={null}>
		<div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, alignItems: "center" }}>
			<select
			value={selectedWsId || ""}
			onChange={(e) => setSelectedWsId(e.target.value)}
			style={{ background: "transparent", color: p.text, border: `1px solid ${p.accent}55`, borderRadius: 8, padding: "6px 8px" }}
			>
			{workspaces.length === 0 && (
				<option value="" style={{ color: "#000" }}>No workspaces yet</option>
			)}
			{workspaces.map((w) => (
				<option key={w.id} value={w.id} style={{ color: "#000" }}>
				{w.name || "Untitled"}
				</option>
			))}
			</select>
			<Button palette={paletteKey} subtle onClick={resetLocal}>Reset local cache</Button>
			<Button palette={paletteKey} onClick={testConnection}>Test connection</Button>
		</div>

		<div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginTop: 10 }}>
			<input
			value={name}
			onChange={(e) => setName(e.target.value)}
			placeholder="New workspace name"
			style={{ background: "transparent", color: p.text, border: `1px solid ${p.accent}55`, borderRadius: 8, padding: "6px 8px" }}
			/>
			<Button
			palette={paletteKey}
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
	const p = PALETTES[paletteKey];

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
	const [progress, setProgress] = useState([]);
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
		setProgress([]); setGoals([]); setPeople([]);
		return;
		}
		const base = doc(db, "workspaces", selectedWsId);

		const unsub1 = onSnapshot(collection(base, "progress"), (snap) =>
		setProgress(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
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

        async function addGoalToProgress(progressId, goal) {
                const id = await addItem("goals", goal);
                if (!id) return;
                const current = progress.find((p) => p.id === progressId)?.goalIds || [];
                updateItem("progress", progressId, { goalIds: [...current, id] });
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

	const [pending, setPending] = useState({ progress: {}, goals: {} });
	const [dragging, setDragging] = useState({ progress: {}, goals: {} });

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

	// Build a goals index for derived progress
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
		if (type === "progress") debouncedPersist("progress", id, { value: Number(finalValue) });
		if (type === "goals") debouncedPersist("goals", id, { percent: Number(finalValue) });
		clearPendingValue(type, id);
		setDraggingFlag(type, id, false);
	}, [pending, debouncedPersist, clearPendingValue, setDraggingFlag]);

	return (
		<div style={{ minHeight: "100vh", background: p.bg, color: p.text }}>
		<div style={{ maxWidth: 1200, margin: "0 auto", padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
                        <Header paletteKey={paletteKey} setPaletteKey={setPaletteKey} user={user} auth={auth} provider={provider} />

			{banner && (
			<div style={{ padding: 12, borderRadius: 10, border: `1px solid ${p.accent}44`, color: p.text, background: `${p.accent}11` }}>{banner}</div>
			)}

			<WorkspaceBar
			paletteKey={paletteKey}
			workspaces={workspaces}
			selectedWsId={selectedWsId}
			setSelectedWsId={setSelectedWsId}
			createWorkspace={createWorkspace}
			resetLocal={resetLocal}
			testConnection={testConnection}
			/>

                        <div role="gridwrap" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 24 }}>
                        <ProgressOverview
                                paletteKey={paletteKey}
                                data={progress}
                                goals={goals}
                                onAdd={(item) => addItem("progress", item)}
                                onUpdate={(id, patch) => updateItem("progress", id, patch)}
                                onDelete={(id) => deleteItem("progress", id)}
                                readOnly={readOnly}
                                computeDerivedPercent={computeDerivedPercent}
                                pending={pending}
                                setPendingValue={setPendingValue}
                                setDraggingFlag={setDraggingFlag}
                                commitSlider={commitSlider}
                                onAddGoal={addGoalToProgress}
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

			<style>{`
			@media (max-width: 1100px) {
				div[role="gridwrap"] { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }
			}
			@media (max-width: 760px) {
				div[role="gridwrap"] { grid-template-columns: 1fr !important; }
			}
			`}</style>

			<div style={{ opacity: 0.7 }}>
			<small>Palette: <span style={{ color: p.accent }}>{PALETTES[paletteKey].name}</span></small>
			</div>
		</div>
		</div>
	);
}
