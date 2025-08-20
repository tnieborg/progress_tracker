import React, { useState } from "react";
import { signInWithPopup, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { PALETTES, Button } from "./ui";

export default function Header({ paletteKey, setPaletteKey, user, auth, provider }) {
  const p = PALETTES[paletteKey];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <h2 style={{ margin: 0, color: p.text }}>Progress Tracker</h2>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <AuthPanel user={user} paletteKey={paletteKey} auth={auth} provider={provider} />
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

function AuthPanel({ user, paletteKey, auth, provider }) {
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
