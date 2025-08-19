# Progress Tracker

This project is a Vite-powered React app backed by Firebase. It tracks progress in multiple workspaces and supports Google authentication.

## Firebase configuration

1. Copy `src/firebase-config.sample.js` to `src/firebase-config.js`.
2. Fill in your Firebase project credentials in `firebase-config.js`.
3. The real config file is ignored by git to keep your keys private.

## Firestore security rules

Your Firestore instance must restrict workspace access to members only. Deploy
rules like the following before running the app or the workspace query will
fail with *Missing or insufficient permissions*:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Minimal profile index so invites by email work
    match /profiles/{uid} {
      allow read:  if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid;
    }

    // Helpers for workspace security
    function wsDoc(wsId) {
      return get(/databases/$(database)/documents/workspaces/$(wsId));
    }
    function isMember(wsId) {
      return request.auth != null && wsDoc(wsId).data.members[request.auth.uid] != null;
    }
    function role(wsId) {
      return wsDoc(wsId).data.members[request.auth.uid];
    }
    function canEdit(wsId) {
      let r = role(wsId);
      return r == "owner" || r == "editor";
    }

    // Workspaces root
    match /workspaces/{wsId} {
      // Allow creating a NEW workspace if the requester sets themselves as owner
      allow create: if request.auth != null
        && request.resource.data.members[request.auth.uid] == "owner"
        && request.resource.data.memberIds.hasOnly([request.auth.uid]);

      // Read for members only
      allow read: if isMember(wsId);

      // Update for owner/editor, delete for owner only
      allow update: if canEdit(wsId);
      allow delete: if request.auth != null && role(wsId) == "owner";
    }

    // Everything inside a workspace (progress/goals/people/etc)
    match /workspaces/{wsId}/{document=**} {
      allow read:  if isMember(wsId);
      allow write: if canEdit(wsId);
    }

    // Deny everything else
    match /{document=**} {
      allow read, write: if false;
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
