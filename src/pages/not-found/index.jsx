import React from "react";
import { Link } from "react-router-dom";
import { Card } from "../../components/ui/ui";

export default function NotFound() {
        return (
                <div className="not-found-page">
                        <Card title="Page Not Found" right={null}>
                                <p>The page you’re looking for doesn’t exist.</p>
                                <p>
                                        <Link to="/">Go to Dashboard</Link>
                                </p>
                        </Card>
                </div>
        );
}

