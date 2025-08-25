import React, { useState } from "react";
import { signOut } from "firebase/auth";
import { Link } from "react-router-dom";
import { Button } from "../ui/ui";

export default function AuthPanel({ user, auth }) {
const [error, setError] = useState("");

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
<Link to="/profile/edit" className="auth-link">
Edit profile
</Link>
<Button onClick={handleSignOut} subtle>
Sign out
</Button>
</>
) : (
<Link to="/login" className="auth-link">
Login
</Link>
)}
{error && <span className="auth-error">{error}</span>}
</div>
);
}
