import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "./firebase";
import { Card, Button } from "./components/ui/ui";
import { useNavigate, Link } from "react-router-dom";

export default function CreateProfile() {
        const [displayName, setDisplayName] = useState("");
        const [email, setEmail] = useState("");
        const [password, setPassword] = useState("");
        const [error, setError] = useState("");
        const navigate = useNavigate();

        const handleCreate = async () => {
                try {
                        setError("");
                        const cred = await createUserWithEmailAndPassword(auth, email, password);
                        if (displayName) {
                                await updateProfile(cred.user, { displayName });
                        }
                        navigate("/");
                } catch (e) {
                        console.error("create profile failed", e);
                        setError("Create profile failed");
                }
        };

        return (
                <div className="profile-page">
                        <Card title="Create Profile" right={null}>
                                <div className="auth-grid">
                                        <input
                                                className="auth-input"
                                                type="text"
                                                placeholder="Display Name"
                                                value={displayName}
                                                onChange={(e) => setDisplayName(e.target.value)}
                                        />
                                        <input
                                                className="auth-input"
                                                type="email"
                                                placeholder="Email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                        />
                                        <input
                                                className="auth-input"
                                                type="password"
                                                placeholder="Password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <Button onClick={handleCreate}>Create Account</Button>
                                        {error && <div className="auth-error">{error}</div>}
                                        <Link to="/login" className="auth-link">
                                                Back
                                        </Link>
                                </div>
                        </Card>
                </div>
        );
}
