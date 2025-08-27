import React from "react";
import "./presence-list.css";

export default function PresenceList({ users = [] }) {
        if (!users.length) return null;
        return (
                <div className="presence-list">
                        {users.map((u) => (
                                <div
                                        key={u.uid || u.id}
                                        className="presence-item"
                                        title={u.name || u.email || ""}
                                >
                                        {u.photoURL ? (
                                                <img src={u.photoURL} alt={u.name || u.email || "user"} />
                                        ) : (
                                                <span>
                                                        {(u.name || u.email || "?")
                                                                .slice(0, 1)
                                                                .toUpperCase()}
                                                </span>
                                        )}
                                </div>
                        ))}
                </div>
        );
}
