# SkillBridge v2 — Phase 1 + Phase 2

Converted from the original single-file HTML/CSS/JS SkillBridge into a React 19 + Vite +
Firebase app, preserving the original branding (colors, fonts, mesh background, card style).

## ✅ Phase 1 — Foundation
- Vite + React 19 + Tailwind scaffold, design tokens ported 1:1 from the original CSS (`tailwind.config.js`)
- Firebase initialized from `.env` (Auth, Firestore, Storage, Analytics) — `src/config/firebase.js`
- **Auth system**: Email register/login, Google Sign-In (popup, auto-profile-creation, existing-user handling),
  forgot/reset password, email verification — `src/services/authService.js`
- **User profile service**: full CRUD against Firestore `users` collection with validation — `src/services/userService.js`
- Centralized error handling — raw Firebase errors never reach the UI — `src/utils/errorMessages.js`
- `AuthContext` (app-wide current user + profile + onboarding state) and `ProtectedRoute`
- Pages: Landing, Auth (login/signup/forgot), Onboarding (profile + skills), Dashboard shell

## ✅ Phase 2 — Profile, Categories & Skill Marketplace
- **Categories**: 12 predefined skill categories seeded idempotently into Firestore on first
  dashboard load — `src/services/categoryService.js`
- **Storage service**: reusable image upload/delete with type + size validation, structured
  paths (`{folder}/{ownerId}/{timestamp}-{filename}`) — `src/services/storageService.js`
- **Skill marketplace**: full CRUD (create/edit/soft-delete), paginated browse with
  category/level filters, client-side search — `src/services/skillService.js`
- **Marketplace UI**: `Marketplace.jsx` (browse/filter/search), `CreateSkillListing.jsx`
  (create + edit, image upload, tags), `SkillDetail.jsx` (view + owner actions)
- **Profile page**: real edit form (name, bio, city, skills, avatar upload), stats, and a grid
  of the user's own listings — `src/pages/Profile.jsx`
- Reusable `SkillCard` and `ImageUploader` components
- Navbar now links to Dashboard / Marketplace / Profile
- `npm run build` and `npm run lint` both pass clean (0 errors)

## 📁 Folder Structure
```
skillbridge/
├── src/
│   ├── config/firebase.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── userService.js
│   │   ├── categoryService.js      # skill categories CRUD + seeding
│   │   ├── skillService.js         # marketplace listings CRUD + browse
│   │   └── storageService.js       # image upload/delete
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── ToastContext.jsx
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── Spinner.jsx
│   │   ├── SkillCard.jsx
│   │   └── ImageUploader.jsx
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── Auth.jsx
│   │   ├── Onboarding.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Marketplace.jsx
│   │   ├── CreateSkillListing.jsx
│   │   ├── SkillDetail.jsx
│   │   └── Profile.jsx
│   ├── utils/errorMessages.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env                            # Firebase config (gitignored)
├── .env.example
├── tailwind.config.js
└── vite.config.js
```

## 🔥 Firestore Collections (so far)
- `users` — full profile schema (name, username, bio, skills, experienceLevel, country,
  city, languages, socialLinks, portfolioWebsite, availabilityStatus, rating, totalSessions, isAdmin, timestamps)
- `categories` — 12 predefined skill categories (id, name, icon)
- `skills` — marketplace listings (mentorId, title, description, categoryId, level, isFree,
  price, durationMinutes, mode, images, availability, tags, status, averageRating, totalReviews, timestamps)

## 🗄️ Firebase Storage (so far)
- `profile-pictures/{uid}/...`
- `skill-images/{uid}/...`
(cover-images, portfolio-files, certificates folders reserved for later phases)

## Setup
```bash
npm install
npm run dev       # local dev
npm run lint       # 0 errors
npm run build      # production build
```
`.env` is already filled in with your existing `help-hub-ai-db2ca` Firebase project.
Add your Gemini key to `VITE_GEMINI_API_KEY` when Phase 4 starts.

## ⚠️ Before this is truly production-ready
Firestore Security Rules and Storage Rules are **not yet written** — right now the Firebase
project is running on whatever rules you currently have (likely test-mode / open). Do not
point this at real user data until rules ship in Phase 4. Composite indexes for `skills`
(status + categoryId + createdAt, status + level + createdAt) will also need to be created
in the Firebase console the first time `browseSkills()` runs with a filter — Firestore will
give you a direct link in the console error to create them with one click.

## 🗺️ Remaining Phases
- **Phase 3**: Learning requests, booking system, real-time messaging, notifications, reviews & ratings, leaderboard
- **Phase 4**: Gemini AI service (recommendations, roadmaps, career guidance, skill gap analysis), Admin panel, Firestore/Storage security rules + composite indexes, final polish & full final report

Reply "Phase 3" (or whatever's next) whenever you're ready and I'll continue from here.

