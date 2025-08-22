import React, { useState } from "react";
import {
        signInWithPopup,
        signInWithEmailAndPassword,
        signOut,
} from "firebase/auth";
import { Button } from "../ui/ui";

export default function AuthPanel({ user, auth, provider }) {
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
                <div className="auth-panel">
                        {user ? (
                                <>
                                        <span className="greeting">Hi, {user.displayName || user.email}</span>
                                        <Button onClick={handleSignOut} subtle>
                                                Sign out
                                        </Button>
                                </>
                        ) : (
                                <>
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
                                        <Button onClick={handleGoogleSignIn}>Google</Button>
                                </>
                        )}
                        {error && <span className="auth-error">{error}</span>}
                </div>
        );
}
