import React, { useState } from "react";
import { updateProfile } from "firebase/auth";
import { auth } from "./firebase";
import { Card, Button } from "./components/ui/ui";
import { useNavigate } from "react-router-dom";

export default function EditProfile() {
        const user = auth.currentUser;
        const [displayName, setDisplayName] = useState(user?.displayName || "");
        const [message, setMessage] = useState("");
        const [error, setError] = useState("");
        const navigate = useNavigate();

        const handleSave = async () => {
                if (!user) return;
                try {
                        setError("");
                        await updateProfile(user, { displayName });
                        setMessage("Profile updated");
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
