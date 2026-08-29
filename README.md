# FisioAdmin - Clinic Management System for Physiotherapy

A web application for managing a physiotherapy practice, built with **React 19**, **Tailwind CSS v4** and **Vite**.

Elegant design focused on the healthcare field, using an **olive green** palette with earthy tones (sage, ochre and clay) that convey calm and professional trust. Fully responsive: the sidebar collapses on mobile and all grids adapt to screen size.

## Features

- **Dashboard**: General overview with stats for patients, appointments, prescriptions and revenue, including growth and monthly revenue charts.
- **Patients**: Full record management with personal info, emergency contact, medical history, allergies, medications, insurance, and appointment/prescription/progress history.
- **Appointments**: Create, edit and change status (scheduled, confirmed, completed, cancelled, no-show).
- **Calendar**: Interactive monthly view with per-day appointments, month navigation and day detail.
- **Prescriptions**: Treatment prescriptions with multiple exercises, sets, reps, frequency and precautions.
- **Progress Tracking**: Clinical evaluations with pain level (1-10), mobility/strength/functionality scores, custom metrics and evolution charts.
- **Metrics & Analytics**: KPIs, demographics by age, performance by specialist, appointment distribution, revenue vs budget, and sessions per day (includes donut and line charts).

## Tech Stack

- React 19
- Tailwind CSS v4
- Vite 8
- Firebase 12 (Firestore + Authentication)
- TypeScript (types)

## Backend: Firebase

La persistencia de datos se realiza en **Cloud Firestore** y el acceso se gestiona con
**Firebase Authentication** (correo y contraseña). No se usa `localStorage`; todo se
sincroniza con la nube.

### Configuración

1. Crea un proyecto en [Firebase](https://console.firebase.google.com).
2. Habilita **Authentication > Sign-in method > Email/Password**.
3. Crea una base de datos de **Firestore** (modo producción).
4. Copia la configuración web (`Project settings > General > Your apps`) a un archivo `.env`:

```bash
cp .env.example .env
```

Las variables son `VITE_FIREBASE_*`. En CI se inyectan desde los **GitHub Secrets**, por lo
que nunca se commitean las claves reales.

### Reglas de seguridad

Despliega `firestore.rules` (permite sólo lectura/escritura a usuarios autenticados):

```bash
firebase deploy --only firestore:rules
```

### Autorización de usuarios

- El **primer usuario** en registrarse se convierte automáticamente en **administrador**.
- Los registros siguientes quedan en estado **pendiente** y no pueden entrar hasta que un
  administrador los apruebe desde la sección **Usuarios** (visible solo para admins).
- Un administrador puede además cambiar el rol (admin/terapeuta) o eliminar usuarios.

### Despliegue con GitHub Secrets

En el workflow de GitHub define los secretos `VITE_FIREBASE_API_KEY`,
`VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`,
`VITE_FIREBASE_MESSAGING_SENDER_ID` y `VITE_FIREBASE_APP_ID`. Vite los expone en la app
vía `import.meta.env`.

## Installation & Usage

```bash
npm install
npm run dev
```

To build for production:

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── layout/          # Sidebar, Footer and main layout
│   ├── dashboard/       # Dashboard and Metrics
│   ├── patients/        # Patient list, form and detail
│   ├── appointments/    # Appointments and Calendar
│   ├── prescriptions/   # Prescriptions and form
│   ├── progress/        # Progress tracking
│   ├── therapists/      # Therapist management
│   └── ui/              # Base components (Card, Button, Modal)
├── context/             # Global state (AppContext)
├── types/               # TypeScript definitions
└── utils/               # Formatting utilities
```

## Visual Theme

Colors are defined as variables in `src/index.css` (`@theme`):

- `primary` / `primary-hover` / `primary-dark` / `primary-light`: olive green (brand)
- `secondary` / `secondary-dark` / `secondary-light`: sage
- `accent` / `accent-light`: ochre/gold
- `clay` / `clay-light`: clay (chart variety)
- `success` / `warning` / `danger`: semantic states in earthy tones

## Version

The version is shown in the page footer (`Footer`) and is read dynamically from `package.json` (`version`), so it always stays in sync with the build.
