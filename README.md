# Progress Tracker

This project is a Vite-powered React app backed by Firebase. It tracks progress in multiple workspaces and supports Google authentication.

## Firebase configuration

1. Copy `src/firebase-config.sample.js` to `src/firebase-config.js`.
2. Fill in your Firebase project credentials in `firebase-config.js`.
3. The real config file is ignored by git to keep your keys private.

## Firestore security rules

Your Firestore instance must allow authenticated users to read and write only
their own workspaces. Deploy rules similar to the following before running the
app or the workspace query will fail with *Missing or insufficient permissions*:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /workspaces/{workspaceId} {
      allow read, update, delete: if request.auth.uid == resource.data.ownerId;
      allow create: if request.auth.uid != null &&
                    request.resource.data.ownerId == request.auth.uid;
    }
    match /workspaces/{workspaceId}/{collection}/{doc} {
      allow read, write: if request.auth.uid ==
        get(/databases/{database}/documents/workspaces/{workspaceId}).data.ownerId;
    }
  }
}
```


## Development

```bash
npm install
npm run dev
```

The UI includes a "Sign in with Google" button in the header. Sign out is available after logging in. Errors during sign-in or sign-out are shown next to the button.
