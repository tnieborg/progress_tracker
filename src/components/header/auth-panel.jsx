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
<Link to="/profile/edit" className="auth-link" aria-label="Edit profile">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="currentColor"/>
    <path d="M20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
  </svg>
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
