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
        getDoc,
        setDoc,
} from "firebase/firestore";
import { Routes, Route, useLocation, useNavigate, useMatch } from "react-router-dom";
import WorkspaceLayout from "./layouts/workspace-layout";
import { db, auth } from "./firebase";
import Header from "./components/header/header";
import WorkspacePage from "./pages/workspace";
import CreateProfile from "./pages/create-profile";
import EditProfile from "./pages/edit-profile";
import LoginPage from "./pages/login";
import Dashboard from "./pages/dashboard";
import NotFound from "./pages/not-found";
import "./App.css";
function sanitizeBanner(text) {
        if (!text) return "";
        let s = String(text);
        s = s.replace(/\uFFFD/g, "");
        s = s.replace(/[â€œâ€]/g, '"').replace(/[â€˜â€™]/g, "'");
        s = s.replace(/^[oO]\.[\s]*/, "");
        return s;
}

export default function App() {
        const [paletteKey, setPaletteKey] = useState("royalViolet");
        const [user, setUser] = useState(null);
        useEffect(() => {
                const unsub = onAuthStateChanged(auth, setUser);
                return () => unsub();
        }, []);

       useEffect(() => {
               if (!user) return;
               (async () => {
                       try {
                               const pRef = doc(db, "profiles", user.uid);
                               const snap = await getDoc(pRef);
                               if (!snap.exists()) {
                                       await setDoc(pRef, {
                                               email: user.email?.toLowerCase() || "",
                                               name: user.displayName || "",
                                       });
                               }
                       } catch (err) {
                               console.error("ensure profile failed", err);
                       }
               })();
       }, [user]);

        const [banner, setBanner] = useState("");
        const [workspaces, setWorkspaces] = useState([]);

const location = useLocation();
const navigate = useNavigate();
const currentWsId = location.pathname.startsWith("/workspace/")
        ? location.pathname.split("/")[2]
        : "";
const isWorkspaceRoute = Boolean(useMatch("/workspace/*"));

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
               if (user && location.pathname === "/login") {
                       navigate("/");
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
                        },
                        (err) => {
                                console.error("workspace load failed", err);
                                setBanner(`Load workspaces failed: ${err.message}`);
                        },
                );
                return () => unsub();
        }, [user, currentWsId]);

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
                        await setDoc(
                                doc(db, "workspaces", d.id, "people", uid),
                                {
                                        uid,
                                        email: auth.currentUser.email?.toLowerCase() || "",
                                        name: auth.currentUser.displayName || "",
                                        role: "owner",
                                        createdAt: serverTimestamp(),
                                },
                        );
                        setWorkspaces((prev) =>
                                prev.map((w) => (w.id === tempId ? { ...w, id: d.id } : w)),
                        );
                        navigate(`/workspace/${d.id}`);
                        setBanner(`Created workspace "${name}".`);
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
                        setBanner("Connection OK: rules permit read/write in this workspace.");
                } catch (err) {
                        setBanner(`Test failed: ${err.message}`);
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
                                showWorkspaceMenu={isWorkspaceRoute}
                        />

                                {banner && <div className="banner">{sanitizeBanner(banner)}</div>}

                               <Routes>
                                       <Route path="/login" element={<LoginPage />} />
                                       <Route path="/profile/new" element={<CreateProfile />} />
                                       {user && (
                                               <>
                                                       <Route
                                                               path="/"
                                                               element={
                                                                       <Dashboard
                                                                               workspaces={workspaces}
                                                                               createWorkspace={createWorkspace}
                                                                       />
                                                               }
                                                       />
                                                       <Route path="/workspace/*" element={
                                                               <WorkspaceLayout
                                                                       workspaces={workspaces}
                                                                       currentWsId={currentWsId}
                                                                       currentUser={user}
                                                                       createWorkspace={createWorkspace}
                                                                       deleteWorkspace={deleteWorkspace}
                                                                       resetLocal={resetLocal}
                                                                       testConnection={testConnection}
                                                               />
                                                       }>
                                                               <Route path=":id" element={
                                                                       <WorkspacePage
                                                                               paletteKey={paletteKey}
                                                                               setPaletteKey={setPaletteKey}
                                                                               setBanner={setBanner}
                                                                       />
                                                               } />
                                                       </Route>
                                                       <Route path="/profile/edit" element={<EditProfile />} />
                                                       <Route path="*" element={<NotFound />} />
                                               </>
                                       )}
                               </Routes>
                        </div>
                </div>
        );
}

