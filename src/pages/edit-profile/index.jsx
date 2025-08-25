import React, { useState } from "react";
import {
        updateProfile,
        updateEmail,
        updatePassword,
} from "firebase/auth";
import { auth } from "../../firebase";
import { Card, Button } from "../../components/ui/ui";
import { useNavigate } from "react-router-dom";
import "./edit-profile.css";

export default function EditProfile() {
        const user = auth.currentUser;
        const [displayName, setDisplayName] = useState(user?.displayName || "");
        const [email, setEmail] = useState(user?.email || "");
        const [password, setPassword] = useState("");
        const [message, setMessage] = useState("");
        const [error, setError] = useState("");
        const navigate = useNavigate();

        const isPasswordUser = user?.providerData.some(
                (p) => p.providerId === "password",
        );

        const handleSave = async () => {
                if (!user) return;
                try {
                        setError("");
                        if (displayName !== user.displayName) {
                                await updateProfile(user, { displayName });
                        }
                        if (isPasswordUser) {
                                if (email && email !== user.email) {
                                        await updateEmail(user, email);
                                }
                                if (password) {
                                        await updatePassword(user, password);
                                }
                        }
                        setMessage("Profile updated");
                        setPassword("");
                } catch (e) {
                        console.error("profile update failed", e);
                        setError("Update failed");
                }
        };

        if (!user) {
                return <div className="profile-page">Please sign in to edit your profile.</div>;
        }

        return (
                <div className="profile-page">
                        <Card title="Edit Profile" right={null}>
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
                                        disabled={!isPasswordUser}
                                />
                                {isPasswordUser && (
                                        <input
                                                className="auth-input"
                                                type="password"
                                                placeholder="New Password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                        />
                                )}
                                {!isPasswordUser && (
                                        <div className="auth-error">
                                                Email and password managed by external provider
                                        </div>
                                )}
                                <Button onClick={handleSave}>Save</Button>
                                {message && <span className="greeting">{message}</span>}
                                {error && <div className="auth-error">{error}</div>}
                                <Button onClick={() => navigate(-1)} subtle>
                                        Back
                                </Button>
                        </Card>
                </div>
        );
}
