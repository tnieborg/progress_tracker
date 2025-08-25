import React, { useState } from "react";
import {
        signInWithPopup,
        signInWithEmailAndPassword,
} from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { Card, Button } from "../../components/ui/ui";
import { auth, provider } from "../../firebase";
import "./login.css";

export default function LoginPage() {
        const [error, setError] = useState("");
        const [email, setEmail] = useState("");
        const [password, setPassword] = useState("");
        const navigate = useNavigate();

        const handleGoogleSignIn = async () => {
                try {
                        setError("");
                        await signInWithPopup(auth, provider);
                        navigate("/");
                } catch (e) {
                        console.error("sign-in failed", e);
                        setError("Sign in failed");
                }
        };

        const handleEmailSignIn = async () => {
                try {
                        setError("");
                        await signInWithEmailAndPassword(auth, email, password);
                        navigate("/");
                } catch (e) {
                        console.error("email sign-in failed", e);
                        setError("Sign in failed");
                }
        };

        return (
                <div className="profile-page">
                        <Card title="Login" right={null}>
                                <div className="auth-grid">
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
                                        <Button onClick={handleEmailSignIn}>Login</Button>
                                        <Button onClick={handleGoogleSignIn}>Sign in with Google</Button>
                                        <Link to="/profile/new" className="auth-link">
                                                Create account
                                        </Link>
                                        {error && <div className="auth-error">{error}</div>}
                                </div>
                        </Card>
                </div>
        );
}
