# Progress Tracker

This project is a Vite-powered React app backed by Firebase. It tracks progress in multiple workspaces and supports Google authentication.

## Firebase configuration

1. Copy `src/firebase-config.sample.js` to `src/firebase-config.js`.
2. Fill in your Firebase project credentials in `firebase-config.js`.
3. The real config file is ignored by git to keep your keys private.

## Development

```bash
npm install
npm run dev
```

The UI includes a "Sign in with Google" button in the header. Sign out is available after logging in. Errors during sign-in or sign-out are shown next to the button.
