# Project Tracker

This project is a Vite-powered React app backed by Firebase. It tracks projects in multiple workspaces and supports Google authentication.

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
    function role(wsId) {
      return get(/databases/$(database)/documents/workspaces/$(wsId))
             .data.members[request.auth.uid];
    }

    match /profiles/{uid} {
      allow read:  if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid;
    }

    match /workspaces/{wsId} {
      // Create: requester sets themselves as owner and sole member initially
      allow create: if request.auth != null
        && request.resource.data.members[request.auth.uid] == "owner"
        && request.resource.data.memberIds == [request.auth.uid];

      // READ: use memberIds for query-safe collection reads
      allow read: if request.auth != null
        && request.auth.uid in resource.data.memberIds;

      // Owners and admins can update workspace metadata
      allow update: if request.auth != null
        && role(wsId) in ["owner", "admin"];

      // Only owners can delete the workspace
      allow delete: if request.auth != null
        && role(wsId) == "owner";

      match /projects/{projectId} {
        allow read: if request.auth != null && role(wsId) != null;
        allow write: if request.auth != null && role(wsId) in ["owner", "admin"];

        match /goals/{goalId} {
          allow read: if request.auth != null && role(wsId) != null;
          allow write: if request.auth != null && (
            role(wsId) in ["owner", "admin", "editor"] ||
            (role(wsId) == "collaborator" && request.resource.data.keys().hasOnly(["status"]))
          );
        }
      }

      match /people/{personId} {
        allow read: if request.auth != null && role(wsId) != null;
        allow write: if request.auth != null && role(wsId) in ["owner", "admin"];
      }
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Each workspace document stores a `members` map of user roles and a parallel
`memberIds` array. The client queries the `memberIds` array to load workspaces
for the signed-in user.

## Development

```bash
npm install
npm run dev
```

The UI includes a "Sign in with Google" button in the header. Sign out is available after logging in. Errors during sign-in or sign-out are shown next to the button.

## Deploy Firestore Rules

Ensure you have the Firebase CLI installed and are logged in (`firebase login`). Then run:

```bash
npm run deploy:rules
```

This uses `firebase.json` to deploy `firestore.rules` only.
