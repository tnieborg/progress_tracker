import React from "react";
import "./tabs.css";

export default function Tabs({ tabs, activeTab, onTabChange }) {
        return (
                <div className="tabs">
                        <div className="tab-headers">
                                {tabs.map((tab) => (
                                        <button
                                                key={tab.id}
                                                className={`tab-header ${
                                                        activeTab === tab.id ? "active" : ""
                                                }`}
                                                onClick={() => onTabChange(tab.id)}
                                        >
                                                {tab.label}
                                        </button>
                                ))}
                        </div>
                        <div className="tab-content">
                                {tabs.map((tab) => (
                                        <div
                                                key={tab.id}
                                                className={`tab-pane ${
                                                        activeTab === tab.id ? "active" : ""
                                                }`}
                                        >
                                                {tab.content}
                                        </div>
                                ))}
                        </div>
                </div>
        );
}
