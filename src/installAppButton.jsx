// InstallAppButton.jsx
import React, { useEffect, useState } from "react";

export default function InstallAppButton() {
	const [deferred, setDeferred] = useState(null);

	useEffect(() => {
		const handler = (e) => {
			e.preventDefault();
			setDeferred(e);
		};
		window.addEventListener("beforeinstallprompt", handler);
		return () => window.removeEventListener("beforeinstallprompt", handler);
	}, []);

	if (!deferred) return null;

	return (
		<button
			onClick={async () => {
				deferred.prompt();
				const { outcome } = await deferred.userChoice;
				if (outcome) setDeferred(null);
			}}
			className="px-3 py-1 rounded border"
			title="Install app"
		>
			Install app
		</button>
	);
}
