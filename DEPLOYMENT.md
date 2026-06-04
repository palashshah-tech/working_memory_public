# Standalone VWM Public Deployment Guide

This guide details how to deploy this project to Vercel and configure the `public-collector` Firebase project.

## 1. Firebase Setup

### A. Enable Authentication
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select the **public-collector** project.
3. In the left navigation, click **Build > Authentication**.
4. Click **Get Started**.
5. Enable the following Sign-in Providers under the **Sign-in method** tab:
   - **Anonymous**: (Toggle to enabled). Used to allow candidate submissions.
   - **Email/Password**: (Toggle to enabled). Used for admin authentication.
6. Under the **Users** tab, click **Add user** and create the admin user:
   - **Email**: `admin@cogscreen.public`
   - **Password**: (Choose a secure password, e.g. the default `cogscreen2026` or any password you prefer).

### B. Setup Firestore Database
1. In the left navigation, click **Build > Firestore Database**.
2. Click **Create database** if not already done. Choose Production/Test mode, default location, and initialize.
3. Navigate to the **Rules** tab and paste the following Security Rules:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Allow candidates to be saved by anyone who is authenticated (including anonymous).
    // Require companyId and createdAt to be set.
    match /candidates/{candidateId} {
      allow create: if request.auth != null
                    && request.resource.data.keys().hasAll(['companyId', 'createdAt']);
      
      // Allow read access ONLY to email-authenticated admin users (like admin@cogscreen.public)
      allow read:   if request.auth != null
                    && request.auth.token.email != null;
                    
      allow update: if false;
      allow delete: if false;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

4. Click **Publish**.

---

## 2. Deploy to Vercel

1. Log in to the [Vercel Dashboard](https://vercel.com).
2. Click **Add New > Project**.
3. Import the repository `https://github.com/palashshah-tech/working_memory_public.git`.
4. In the configuration settings:
   - **Framework Preset**: Vite (detected automatically).
   - **Root Directory**: (Leave as root `./` because this repository holds only the public codebase).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. In the **Environment Variables** section, add the following variables:
   - `VITE_FIREBASE_API_KEY`: `AIzaSyDiil_B6FNiSjQFplAZiVwNkLTIh-WwVkc`
   - `VITE_FIREBASE_AUTH_DOMAIN`: `public-collector.firebaseapp.com`
   - `VITE_FIREBASE_PROJECT_ID`: `public-collector`
   - `VITE_FIREBASE_STORAGE_BUCKET`: `public-collector.firebasestorage.app`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`: `943796400498`
   - `VITE_FIREBASE_APP_ID`: `1:943796400498:web:aab9516bf5706b6ae3edeb`
6. Click **Deploy**.
