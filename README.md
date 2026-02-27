<div align="center">

# 🥦 FreshFocus

### *Smart Fridge Management & Food Waste Reduction*

**An AI-powered web app that helps households track ingredients, reduce food waste, and eat healthier — powered by Google Gemini.**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%2B%20Auth-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI%20Powered-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

</div>

---

## � Project Description

### Problem Statement

Over **one-third of all food produced globally is wasted** — amounting to 1.3 billion tonnes per year. At the household level, most waste happens simply because people forget what they have, lose track of expiry dates, or don't know what to cook with near-expiry ingredients. This leads to unnecessary spending, unnecessary landfill waste, and unnecessary greenhouse gas emissions.

FreshFocus addresses this problem by acting as an intelligent, always-on fridge companion. It eliminates the mental overhead of tracking ingredients manually, and uses AI to turn "what's in my fridge?" into actionable answers: what's expiring, what to cook, and what to buy next.

### Purpose

FreshFocus empowers everyday households to:
- **See** what they have and what's about to expire at a glance
- **Act** on near-expiry ingredients by getting personalised recipe suggestions
- **Understand** their consumption habits through waste analytics
- **Plan** smarter with a real-time synced shopping list

---

## 🌍 Alignment with AI & UN Sustainable Development Goals (SDGs)

### How FreshFocus Uses AI

FreshFocus integrates **Google Gemini**, a state-of-the-art large multimodal model, at two critical points in the user journey:

1. **Vision AI (Fridge Scanning)** — Users take a photo of their fridge. Gemini analyses the image and returns a structured list of detected ingredients, estimated quantities, and predicted shelf life — removing the need for manual entry entirely.
2. **Generative AI (Recipe Generation)** — Given the user's ingredient inventory, dietary restrictions, and fitness goals, Gemini generates personalised recipes that deliberately prioritise near-expiry ingredients to close the loop on waste.

AI is not a bolt-on feature here — it is the core mechanism that makes the product effortless. Without it, the friction of manual inventory management would prevent adoption.

### SDG Alignment

| SDG | How FreshFocus Contributes |
|---|---|
| **SDG 2 — Zero Hunger** | Indirectly contributes by optimising home food use, reducing waste, and helping households make better use of available ingredients |
| **SDG 3 — Good Health & Well-being** | Encourages healthier eating habits by providing balanced recipes generated from available ingredients |
| **SDG 12 — Responsible Consumption & Production** | Directly tackles household food waste — one of the largest contributors to Target 12.3 (halving per-capita food waste by 2030) |
| **SDG 13 — Climate Action** | Reducing food waste cuts methane emissions from landfills and lowers the carbon footprint of food production |

---

## 🏗️ Technical Architecture

```
┌─────────────────────────────────────────────────────┐
│                   FreshFocus SPA                    │
│            (React 19 + Vite + TypeScript)           │
│                                                     │
│Inventory │ Recipes │ Dashboard │ Shopping │ Settings│
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │             Service Layer                    │   │
│  │  gemini.ts (AI)       firebase.ts (Auth+DB)  │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
          │                          │
          ▼                          ▼
  ┌───────────────┐         ┌─────────────────┐
  │ Google Gemini │         │ Firebase Cloud  │
  │ Vision + Text │         │ Firestore Auth  │
  └───────────────┘         └─────────────────┘
```

---

## 🔧 Project Documentation

### Technologies Used

| Category | Technology | Role |
|---|---|---|
| **Frontend** | React 19 + TypeScript | Component-based UI, type safety |
| **Build Tool** | Vite 6 | Fast dev server & production bundler |
| **Styling** | Tailwind CSS v4 | Utility-first responsive design |
| **Animations** | Motion (Framer Motion) | Smooth enter/exit transitions |
| **Charts** | Recharts | Waste & nutrition analytics |
| **🔵 Google — AI** | Google Gemini API | Fridge image analysis, recipe generation |
| **🔵 Google — Auth** | Firebase Authentication | Secure user sign-up / login |
| **🔵 Google — DB** | Firebase Firestore | Real-time cross-device data sync |
| **🔵 Google — Storage** | Firebase Storage | Profile photo uploads |
| **Icons** | Lucide React | Consistent icon system |
| **Markdown** | react-markdown | Renders AI-generated content safely |

### Application Features

| Feature | Description |
|---|---|
| 📷 **AI Fridge Scanning** | Rear-camera capture → Gemini Vision → structured ingredient list with days-to-expiry |
| 🧂 **Ingredient Inventory** | Expiry risk badges (Fresh / Use Soon / Expired), quantity tracking, usage logging |
| 🍳 **AI Recipe Generation** | Gemini generates 3 personalised recipes, prioritising near-expiry ingredients |
| 📊 **Waste Dashboard** | Pie chart (used vs. wasted) + nutritional balance bar chart of fridge contents, computed client-side |
| 🛒 **Shopping List** | Persistent, real-time synced grocery list with purchase toggle |
| ⚙️ **User Preferences** | Dietary restrictions, fitness goals, and taste preferences for AI personalisation |
| 🔐 **Authentication** | Firebase Auth with profile name editing |
| ☁️ **Real-time Sync** | Firestore `onSnapshot` listeners — works across devices, no polling |

---

### Technical Implementation

#### 1. AI Fridge Scanning

The camera modal uses the **browser MediaDevices API** (`getUserMedia` with `facingMode: 'environment'`) to access the device's rear camera. A canvas element captures each frame, encodes it as a base64 JPEG, and submits it to **Gemini's multimodal endpoint**. Crucially, the response is enforced using Gemini's `responseSchema` config — guaranteeing a structured JSON array and eliminating unpredictable freeform output.

```typescript
const response = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: [{ inlineData: { mimeType: "image/jpeg", data: base64Image } }, { text: prompt }],
  config: {
    responseMimeType: "application/json",
    responseSchema: { type: Type.ARRAY, items: { /* name, quantity, estimatedDaysLeft */ } }
  }
});
```

#### 2. AI Recipe Generation

Recipes are generated by constructing a prompt from the live ingredient list (including expiry risk labels) and the user's stored preferences. Gemini is instructed to prioritise `'soon'` and `'expired'` ingredients. The response schema enforces full recipe structure (name, description, instructions, prep time, health indicators, tags).

#### 3. Real-time Firestore Sync (Loop Prevention)

Three `onSnapshot` listeners run concurrently for ingredients, shopping list, and preferences. A `isRemoteUpdate` React ref prevents write-back loops: when Firestore pushes data, the flag is set before state is updated, and save `useEffect` hooks skip writing if the change came from Firestore.

#### 4. Expiry Risk Classification

| Status | Days Remaining | Colour |
|---|---|---|
| 🟢 Fresh | > 7 days | Emerald |
| 🟡 Use Soon | 1–7 days | Amber |
| 🔴 Expired | 0 days | Rose |

Expiry is computed dynamically at render time from an ISO date string — not stored as a static counter — ensuring accuracy regardless of when the ingredient was added.

---

### Innovation

FreshFocus innovates at the **intersection of computer vision, generative AI, and behaviour change**:

- **Zero-friction onboarding**: The AI fridge scanner eliminates the need to manually type ingredients, removing a major barrier in traditional inventory apps.
- **Closed-loop waste reduction**: AI operates at both ends — detecting available ingredients and suggesting recipes or actions before they expire.
- **Structured AI outputs**: Using Gemini's native JSON schema enforcement (not regex parsing) ensures reliable, type-safe data that integrates seamlessly with the TypeScript data layer.
- **Real-time multi-device sync**: Firestore listeners make FreshFocus feel like a native app across phones, tablets, and desktops without any backend code.

---

### Technical Challenge
**Challenge:** Firestore `onSnapshot` listeners combined with React `useEffect` hooks caused a write-back loop, leading to infinite updates.

**Solution:** Introduced an `isRemoteUpdate` ref to track whether a state change originated from Firestore. Save effects now skip writing back if the update is remote, preventing loops.

**Decision Impact:** This ensured real-time multi-device sync without conflicts or performance issues, keeping the inventory and shopping list consistent across all user devices.

---

### Challenges Faced

#### 1. Real-time Sync Write-back Loop
**Problem:** Firestore `onSnapshot` and `useEffect` save hooks created an infinite loop — every Firestore update triggered a re-save.  
**Solution:** An `isRemoteUpdate` ref flag marks Firestore-originated state changes so save effects are skipped.

#### 2. AI Response Reliability
**Problem:** LLMs can return malformed JSON, especially for nested schemas like recipes.  
**Solution:** Gemini's `responseMimeType: "application/json"` + `responseSchema` configuration enforces structured output at the API level, with `try/catch` fallbacks for edge cases.

#### 3. Expiry Date Drift
**Problem:** Storing days-remaining as a static integer caused stale expiry statuses over time.  
**Solution:** `calculateDaysLeft(dateString)` recomputes remaining days from an ISO date string relative to today on every render.

#### 4. Mobile Camera Access
**Problem:** Not all browsers default to the rear-facing camera.  
**Solution:** `getUserMedia({ video: { facingMode: 'environment' } })` explicitly requests the rear camera, with graceful error handling for denied permissions.

#### 5. State Initialisation Race Condition
**Problem:** Save effects fired before Firestore finished loading, overwriting cloud data with empty local state.  
**Solution:** An `initialLoadComplete` boolean flag gates all save effects until all three Firestore listeners have received their first snapshot.

---

## � Project Structure

```
freshfocus/
├── src/
│   ├── App.tsx          # Root component — state, business logic, all tabs
│   ├── AuthForm.tsx     # Login / Register UI
│   ├── types.ts         # TypeScript interfaces (Ingredient, Recipe, UserPreferences…)
│   ├── main.tsx         # React entry point
│   ├── index.css        # Global styles
│   └── services/
│       ├── gemini.ts    # Gemini AI: fridge scan + recipe generation
│       └── firebase.ts  # Firebase: Auth + Firestore initialisation
├── index.html
├── vite.config.ts
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- A [Google Gemini API key](https://ai.google.dev/)
- A [Firebase project](https://console.firebase.google.com/) with Authentication and Firestore enabled

### Installation

```bash
git clone https://github.com/chanjiehui/kitahack.git
cd kitahack/freshfocus
npm install
```

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Google Gemini
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> **Gemini API key** — get one at [ai.google.dev](https://ai.google.dev/)  
> **Firebase credentials** — found in your Firebase project settings under *General → Your apps → SDK setup*

### Run Locally

```bash
npm run dev   # http://localhost:3000
```

### Firestore Security Rules

In the Firebase console, go to **Firestore → Rules** and paste the following:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Each authenticated user can only read/write their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Deny all other access by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

This ensures every user's ingredients, shopping list, and preferences are fully isolated — no user can access another user's data.

---

## 🗺️ Future Roadmap

| Timeline | Feature |
|---|---|
| Short-term | Food icons for each ingredient |
| Short-term | Push notifications for near-expiry alerts |
| Medium-term | Weekly meal planner integrated with recipe engine |
| Long-term | Multi-fridge support |
| Long-term | Carbon footprint tracking — calculate CO₂ saved per ingredient |

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---
