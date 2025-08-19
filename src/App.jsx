import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { initializeApp } from "firebase/app";
import {
	getAuth,
	onAuthStateChanged,
	signInWithPopup,
	signInWithEmailAndPassword,
	signOut,
	GoogleAuthProvider,
} from "firebase/auth";
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
} from "firebase/firestore";
import { firebaseConfig } from "./firebase-config";

	// ========== Palettes ==========
const PALETTES = {
	royalViolet: {
		name: "Royal Violet",
		bg: "#1B1B2F",
		card: "#2C2C3E",
		text: "#F1F1F8",
		accent: "#9D4EDD",
		accentSubtle: "#C77DFF",
	},
	coralSpark: {
		name: "Coral Spark",
		bg: "#202124",
		card: "#2F3136",
		text: "#EEEEEE",
		accent: "#FF6B6B",
		accentSubtle: "#FF9F80",
	},
	neonCyan: {
		name: "Neon Cyan",
		bg: "#0D1B2A",
		card: "#1B263B",
		text: "#E0E1DD",
		accent: "#00B4D8",
		accentSubtle: "#90E0EF",
	},
};


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

// ========== UI Atoms ==========
function Card({ palette, title, right, children }) {
	return (
		<div
		style={{
			background: PALETTES[palette].card,
			border: `1px solid ${PALETTES[palette].accent}22`,
			borderRadius: 16,
			padding: 16,
			boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
		}}
		>
		<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
			<h3 style={{ margin: 0, color: PALETTES[palette].text }}>{title}</h3>
			{right}
		</div>
		{children}
		</div>
	);
}

function Button({ children, onClick, subtle, palette, style, disabled }) {
	const p = PALETTES[palette];
	return (
		<button
		onClick={onClick}
		disabled={disabled}
		style={{
			padding: "8px 12px",
			borderRadius: 10,
			border: `1px solid ${p.accent}${subtle ? "55" : "AA"}`,
			background: subtle ? "transparent" : `${p.accent}22`,
			color: p.text,
			cursor: disabled ? "not-allowed" : "pointer",
			...style,
		}}
		>
		{children}
		</button>
	);
}

function AddRow({ type, onAdd, disabled, placeholder }) {
	const [text, setText] = useState("");
	const handleSubmit = () => {
		const v = text.trim();
		if (!v) return;
		if (type === "people") onAdd({ name: v, status: "watching" });
		if (type === "progress") onAdd({ label: v, value: 0, goalIds: [], auto: false });
		if (type === "goals") onAdd({ title: v, percent: 0 });
		setText("");
	};
	return (
		<div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginTop: 12 }}>
		<input
			disabled={disabled}
			value={text}
			onChange={(e) => setText(e.target.value)}
			placeholder={placeholder}
			style={{
			background: "transparent",
			color: "inherit",
			border: "1px solid rgba(255,255,255,.2)",
			borderRadius: 8,
			padding: "8px 10px",
			}}
		/>
		<button onClick={handleSubmit} disabled={disabled} style={{ borderRadius: 8, border: "1px solid rgba(255,255,255,.3)", padding: "8px 10px" }}>
			Add
		</button>
		</div>
	);
}

function Header({ paletteKey, setPaletteKey, user }) {
	const p = PALETTES[paletteKey];
	return (
		<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
		<h2 style={{ margin: 0, color: p.text }}>Progress Tracker</h2>
		<div style={{ display: "flex", gap: 12, alignItems: "center" }}>
			<AuthPanel user={user} paletteKey={paletteKey} />
			<label style={{ opacity: 0.8 }}>Theme</label>
			<select
			value={paletteKey}
			onChange={(e) => setPaletteKey(e.target.value)}
			style={{ background: "transparent", color: p.text, border: `1px solid ${p.accent}55`, borderRadius: 8, padding: "4px 6px" }}
			>
			{Object.entries(PALETTES).map(([k, v]) => (
				<option key={k} value={k} style={{ color: "#000" }}>
				{v.name}
				</option>
			))}
			</select>
		</div>
		</div>
	);
}

function AuthPanel({ user, paletteKey }) {
	const p = PALETTES[paletteKey];
	const [error, setError] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const handleGoogleSignIn = async () => {
		try {
		setError("");
		await signInWithPopup(auth, provider);
		} catch (e) {
		console.error("sign-in failed", e);
		setError("Sign in failed");
		}
	};
	const handleEmailSignIn = async () => {
		try {
		setError("");
		await signInWithEmailAndPassword(auth, email, password);
		} catch (e) {
		console.error("email sign-in failed", e);
		setError("Sign in failed");
		}
	};
	const handleSignOut = async () => {
		try {
		setError("");
		await signOut(auth);
		} catch (e) {
		console.error("sign-out failed", e);
		setError("Sign out failed");
		}
	};
	return (
		<div style={{ display: "flex", gap: 12, alignItems: "center" }}>
		{user ? (
			<>
			<span style={{ opacity: 0.85 }}>Hi, {user.displayName || user.email}</span>
			<Button palette={paletteKey} onClick={handleSignOut} subtle>
				Sign out
			</Button>
			</>
		) : (
			<>
			<input
				type="email"
				placeholder="Email"
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				style={{
				background: "transparent",
				color: p.text,
				border: `1px solid ${p.accent}55`,
				borderRadius: 8,
				padding: "6px 8px",
				}}
			/>
			<input
				type="password"
				placeholder="Password"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				style={{
				background: "transparent",
				color: p.text,
				border: `1px solid ${p.accent}55`,
				borderRadius: 8,
				padding: "6px 8px",
				}}
			/>
			<Button palette={paletteKey} onClick={handleEmailSignIn}>
				Login
			</Button>
			<Button palette={paletteKey} onClick={handleGoogleSignIn}>
				Google
			</Button>
			</>
		)}
		{error && <span style={{ color: p.accent }}>{error}</span>}
		</div>
	);
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
                );
                const unsub = onSnapshot(
                q,
                (snap) => {
                        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                        setWorkspaces(list);
                        if (!selectedWsId && list[0]) setSelectedWsId(list[0].id);
                },
                (err) => {
                        console.error("failed to load workspaces", err);
                        setBanner(`Failed to load workspaces: ${err.message}`);
                }
                );
                return () => unsub();
        }, [user, selectedWsId]);

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
		if (!ref) { setBanner("No workspace selected."); return; }
		try {
		await addDoc(ref, { ...item, createdAt: serverTimestamp() });
		} catch (err) {
		setBanner(`Add failed: ${err.message}`);
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

	// Workspace operations
	async function createWorkspace(name) {
		if (!auth.currentUser) {
			setBanner("Please sign in to create a workspace.");
			return "";
		}
		try {
			const uid = auth.currentUser.uid;
			const wsRef = collection(db, "workspaces");

			// Optimistically add a temporary option so the <select> isn't blank
			const tempId = "temp-" + Math.random().toString(36).slice(2);
			setWorkspaces((prev) => [
			...prev,
			{ id: tempId, name, members: { [uid]: "owner" }, memberIds: [uid], createdAt: new Date() }
			]);
			setSelectedWsId(tempId);

			// Write a workspace that satisfies your rules
                        const d = await addDoc(wsRef, {
                        name,
                        createdAt: serverTimestamp(),
                        createdBy: uid,
                        members: { [uid]: "owner" },
                        memberIds: [uid],
                        });

                        // Switch the select to the real id and replace temp entry
                        setSelectedWsId(d.id);
                        setWorkspaces((prev) => prev.map((w) => w.id === tempId ? { ...w, id: d.id } : w));
                        setBanner(`Created workspace “${name}”.`);
                        return d.id;
                } catch (err) {
                        // Remove the temporary entry on failure
                        setWorkspaces((prev) => prev.filter((w) => w.id !== tempId));
                        setBanner(`Create workspace failed: ${err.message}`);
                        return "";
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

	const List = ({ title, type, data, onAdd, onUpdate, onDelete }) => (
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

					{/* Goal linking + auto toggle */}
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

	return (
		<div style={{ minHeight: "100vh", background: p.bg, color: p.text }}>
		<div style={{ maxWidth: 1200, margin: "0 auto", padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
			<Header paletteKey={paletteKey} setPaletteKey={setPaletteKey} user={user} />

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
			<List title="Track Progress" type="progress" data={progress} onAdd={(item) => addItem("progress", item)} onUpdate={(id, patch) => updateItem("progress", id, patch)} onDelete={(id) => deleteItem("progress", id)} />
			<List title="Goals" type="goals" data={goals} onAdd={(item) => addItem("goals", item)} onUpdate={(id, patch) => updateItem("goals", id, patch)} onDelete={(id) => deleteItem("goals", id)} />
			<List title="Tracked People Projects" type="people" data={people} onAdd={(item) => addItem("people", item)} onUpdate={(id, patch) => updateItem("people", id, patch)} onDelete={(id) => deleteItem("people", id)} />
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
