import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
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
} from "firebase/firestore";
import { Link, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { db, auth } from "./firebase";
import Header from "./components/header/header";
import WorkspacePage from "./workspace-page";
import CreateProfile from "./create-profile";
import EditProfile from "./edit-profile";
import LoginPage from "./login-page";
import { Card, Button } from "./components/ui/ui";
import "./App.css";

function WorkspaceNav({ workspaces, currentWsId, createWorkspace, deleteWorkspace, resetLocal, testConnection }) {
        const [name, setName] = useState("");
        const navigate = useNavigate();
        return (
                <div className="workspace-nav">
                        <Card title="Workspaces" right={null}>
                                <div className="workspace-bar">
                                        {workspaces.length === 0 && <span>No workspaces yet</span>}
                                        {workspaces.map((w) => (
                                                <Link
                                                        key={w.id}
                                                        to={`/workspace/${w.id}`}
                                                        className={w.id === currentWsId ? "workspace-link active" : "workspace-link"}
                                                >
                                                        {w.name || "Untitled"}
                                                </Link>
                                        ))}
                                        <Button subtle onClick={resetLocal}>Reset local cache</Button>
                                        <Button onClick={testConnection}>Test connection</Button>
                                        <Button
                                                onClick={() => {
                                                        if (
                                                                currentWsId &&
                                                                window.confirm(
                                                                        "Delete this workspace? This will remove all data.",
                                                                )
                                                        ) {
                                                                deleteWorkspace(currentWsId);
                                                        }
                                                }}
                                                disabled={!currentWsId}
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
                                                        if (id) navigate(`/workspace/${id}`);
                                                        setName("");
                                                }}
                                        >
                                                Create
                                        </Button>
                                </div>
                        </Card>
                </div>
        );
}

export default function App() {
        const [paletteKey, setPaletteKey] = useState("royalViolet");
        const [user, setUser] = useState(null);
        useEffect(() => {
                const unsub = onAuthStateChanged(auth, setUser);
                return () => unsub();
        }, []);

        const [banner, setBanner] = useState("");
        const [workspaces, setWorkspaces] = useState([]);

const location = useLocation();
const navigate = useNavigate();
const currentWsId = location.pathname.startsWith("/workspace/")
        ? location.pathname.split("/")[2]
        : "";

       useEffect(() => {
               if (
                       !user &&
                       location.pathname !== "/login" &&
                       location.pathname !== "/profile/new"
               ) {
                       navigate("/login");
               }
       }, [user, location.pathname, navigate]);

       useEffect(() => {
               if (!user) {
                       setWorkspaces([]);
                        return;
                }
                const q = query(
                        collection(db, "workspaces"),
                        where("memberIds", "array-contains", user.uid),
                );
                const unsub = onSnapshot(
                        q,
                        (snap) => {
                                const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                                setWorkspaces(list);
                                if (!currentWsId && list[0]) navigate(`/workspace/${list[0].id}`);
                        },
                        (err) => {
                                console.error("workspace load failed", err);
                                setBanner(`Load workspaces failed: ${err.message}`);
                        },
                );
                return () => unsub();
        }, [user, currentWsId, navigate]);

        async function createWorkspace(name) {
                if (!auth.currentUser) {
                        setBanner("Please sign in to create a workspace.");
                        return "";
                }
                const tempId = "temp-" + Math.random().toString(36).slice(2);
                try {
                        const uid = auth.currentUser.uid;
                        setWorkspaces((prev) => [
                                ...prev,
                                {
                                        id: tempId,
                                        name,
                                        members: { [uid]: "owner" },
                                        memberIds: [uid],
                                        createdAt: new Date(),
                                        paletteKey: "royalViolet",
                                },
                        ]);
                        const d = await addDoc(collection(db, "workspaces"), {
                                name,
                                createdAt: serverTimestamp(),
                                createdBy: uid,
                                members: { [uid]: "owner" },
                                memberIds: [uid],
                                paletteKey: "royalViolet",
                        });
                        setWorkspaces((prev) =>
                                prev.map((w) => (w.id === tempId ? { ...w, id: d.id } : w)),
                        );
                        navigate(`/workspace/${d.id}`);
                        setBanner(`Created workspace “${name}”.`);
                        return d.id;
                } catch (err) {
                        setWorkspaces((prev) => prev.filter((w) => w.id !== tempId));
                        setBanner(`Create workspace failed: ${err.message}`);
                        return "";
                }
        }

        async function deleteWorkspace(id) {
                try {
                        const wsRef = doc(db, "workspaces", id);
                        const projectSnap = await getDocs(collection(wsRef, "projects"));
                        await Promise.all(
                                projectSnap.docs.map(async (p) => {
                                        const goalsSnap = await getDocs(collection(p.ref, "goals"));
                                        await Promise.all(goalsSnap.docs.map((g) => deleteDoc(g.ref)));
                                        await deleteDoc(p.ref);
                                }),
                        );
                        const peopleSnap = await getDocs(collection(wsRef, "people"));
                        await Promise.all(peopleSnap.docs.map((d) => deleteDoc(d.ref)));
                        await deleteDoc(wsRef);
                        if (currentWsId === id) {
                                const remaining = workspaces.find((w) => w.id !== id);
                                if (remaining) navigate(`/workspace/${remaining.id}`);
                                else navigate("/");
                        }
                        setBanner("Workspace deleted.");
                } catch (err) {
                        setBanner(`Delete workspace failed: ${err.message}`);
                }
        }

        function resetLocal() {
                setBanner("Local cache cleared.");
                if (currentWsId) {
                        navigate("/");
                        setTimeout(() => navigate(`/workspace/${currentWsId}`), 0);
                }
        }

        async function testConnection() {
                if (!currentWsId) {
                        setBanner("No workspace selected.");
                        return;
                }
                try {
                        const base = doc(db, "workspaces", currentWsId);
                        const pingCol = collection(base, "__ping");
                        const added = await addDoc(pingCol, { t: Date.now() });
                        await deleteDoc(doc(pingCol, added.id));
                        setBanner("✅ Connection OK: rules permit read/write in this workspace.");
                } catch (err) {
                        setBanner(`❌ Test failed: ${err.message}`);
                }
        }

        const handlePaletteChange = async (key) => {
                setPaletteKey(key);
                if (currentWsId) {
                        try {
                                await updateDoc(doc(db, "workspaces", currentWsId), { paletteKey: key });
                        } catch (err) {
                                setBanner(`Update theme failed: ${err.message}`);
                        }
                }
        };

        return (
                <div className={`app palette-${paletteKey}`}>
                        <div className="container">
                               <Header
                                       paletteKey={paletteKey}
                                       setPaletteKey={handlePaletteChange}
                                       user={user}
                                       auth={auth}
                                       workspaces={workspaces}
                                       currentWsId={currentWsId}
                                       createWorkspace={createWorkspace}
                               />

                                {banner && <div className="banner">{banner}</div>}

                               {user && (
                                       <WorkspaceNav
                                               workspaces={workspaces}
                                               currentWsId={currentWsId}
                                               createWorkspace={createWorkspace}
                                               deleteWorkspace={deleteWorkspace}
                                               resetLocal={resetLocal}
                                               testConnection={testConnection}
                                       />
                               )}

                               <Routes>
                                       <Route path="/login" element={<LoginPage />} />
                                       <Route path="/profile/new" element={<CreateProfile />} />
                                       {user && (
                                               <>
                                                       <Route
                                                               path="/workspace/:id"
                                                               element={
                                                                       <WorkspacePage
                                                                               paletteKey={paletteKey}
                                                                               setPaletteKey={setPaletteKey}
                                                                               setBanner={setBanner}
                                                                       />
                                                               }
                                                       />
                                                       <Route path="/profile/edit" element={<EditProfile />} />
                                                       <Route path="*" element={<div>Select a workspace</div>} />
                                               </>
                                       )}
                               </Routes>
                        </div>
                </div>
        );
}

