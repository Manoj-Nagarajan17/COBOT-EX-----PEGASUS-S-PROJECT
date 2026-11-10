title: "ResQGrid: Zero-Bloat Emergency Response Platform"
description: "An AI-assisted, lightweight GIS disaster management system built with Vanilla JS, Node.js, and PostgreSQL."
version: "1.0.0"
author: "ResQGrid Development Team"
keywords: \["Emergency Response", "Disaster Management", "Zero-Bloat", "GIS Mapping", "Vanilla JavaScript", "Mapbox", "Node.js"\]

# ResQGrid: AI-Assisted Emergency Response & Disaster Management Platform

> **ResQGrid** is an enterprise-grade, ultra-lightweight web application engineered for real-time disaster management. By strictly adhering to a **Zero-Bloat Architecture**, it ensures maximum uptime and rapid load speeds even in degraded network conditions during critical emergencies.

## 📖 Table of Contents

1. [Architectural Philosophy](#-architectural-philosophy)

2. [Core Platform Features](#-core-platform-features)

3. [Technical SEO & Discoverability](#-technical-seo--discoverability)

4. [Technology Stack](#-technology-stack)

5. [System Architecture Flow](#-system-architecture-flow)

6. [API Specification](#-api-specification)

7. [Installation & Local Deployment](#-installation--local-deployment)

8. [Project Structure](#-project-structure)

9. [License](#-license)

## 🏛️ Architectural Philosophy

During a crisis, internet bandwidth is severely constrained. ResQGrid is built to function flawlessly under these conditions by avoiding heavy frontend frameworks (like React or Angular) and relying entirely on highly optimized native web technologies.

* **Zero Frontend Bloat:** Pure HTML5, CSS3, and ES6+ Modular JavaScript. No Virtual DOM overhead.

* **Edge Processing:** Client-side EXIF metadata extraction to pull raw GPS coordinates from uploaded evidence photos *before* aggressive client-side image compression.

* **Bandwidth Optimization:** Implementation of Server-Sent Events (SSE) instead of WebSocket polling, strict API pagination, and GZIP/Brotli backend compression.

## ✨ Core Platform Features

### 1. Tri-Tier Role-Based Access Control (RBAC)

* **Citizen Portal (Public):** Allows users to submit geo-tagged emergency reports, trigger one-touch SOS alerts, and view verified local incident statuses.

* **Control Room Dashboard (Admin):** A centralized command center featuring real-time KPI analytics, incident verification workflows, and transactional resource allocation.

* **Response Team Hub (Field Units):** A streamlined mobile-first interface for field teams to accept assignments, update ETA, and verify incident resolution with on-site evidence.

### 2. Intelligent Incident Prioritization

An automated, deterministic rule-based scoring engine that evaluates incoming reports. It dynamically ranks incidents into **Critical, High, Medium, or Low** tiers based on:

* Emergency Category (e.g., Building Collapse vs. Minor Flood)

* Number of Affected Individuals

* Geographic Hotspot Proximity

* Time Elapsed Since Initial Report

### 3. High-Performance GIS Mapping

Powered by **Mapbox GL JS** initialized via Vanilla JavaScript.

* **Lively Locations:** Dynamic vector maps rendering incident hotspots with severity-color-coded markers.

* **Route Visualization:** Real-time GeoJSON route mapping calculating the optimal path between deployed emergency units and crisis coordinates.

* **Lazy Loading:** Map tiles and heavy rendering libraries are only requested when the map viewport is actively triggered by the user.

## 🔍 Technical SEO & Discoverability

To ensure public reporting portals are discoverable by citizens via search engines, the platform integrates robust Technical SEO standards:

* **Semantic HTML5:** Strict utilization of `<main>`, `<article>`, `<nav>`, and `<aside>` tags for optimal DOM parsing.

* **Dynamic JSON-LD Structured Data:** Express.js injects Schema.org `EmergencyService` and `GovernmentService` markup into public routes.

* **Dynamic Meta Tags:** Server-side rendered `<title>`, `<meta name="description">`, and Open Graph tags for optimal social sharing during crises.

* **Automated Directives:** Dynamically generated `sitemap.xml` for public pages and a strict `robots.txt` that explicitly disallows indexing of `/admin`, `/team`, and `/api` endpoints.

## 💻 Technology Stack

| Domain | Technology | Implementation Justification | 
| ----- | ----- | ----- | 
| **Frontend** | Vanilla HTML5, CSS3, ES6 | Achieves near-instant Time to Interactive (TTI) without heavy bundle parsing. | 
| **Backend** | Node.js, Express.js | Non-blocking, event-driven architecture perfect for handling asynchronous SOS requests. | 
| **Database** | PostgreSQL | Strictly normalized relational database ensuring data integrity and transactional safety. | 
| **GIS / Mapping** | Mapbox GL JS | Lightweight vector tile rendering with robust routing capabilities. | 
| **Security** | Argon2 / bcrypt | Industry-standard password hashing coupled with HTTP-only secure session cookies. | 

## ⚙️ System Architecture Flow

The following sequence details the lifecycle of a citizen-reported emergency.

```
sequenceDiagram
    autonumber
    actor C as Citizen
    participant F as Vanilla JS Client
    participant API as Node/Express API
    participant DB as PostgreSQL
    participant MAP as Mapbox Server

    C->>F: Captures & Uploads Disaster Photo
    F->>F: Extract EXIF GPS Metadata & Compress JPG
    F->>API: POST /api/incidents (JSON + GeoData)
    API->>API: Execute Prioritization Engine (Assess Severity)
    API->>DB: INSERT Incident Record & Audit Trail
    DB-->>API: Transaction Complete
    API-->>F: HTTP 201 Created
    API-->>API: Trigger SSE Broadcast
    API->>MAP: Control Room Receives Event
    MAP->>MAP: Render Mapbox Marker & Route Vector

```

## 🔌 API Specification

All endpoints require standard `Bearer` token authentication via secure cookies unless marked as public.

| Method | Endpoint | Description | Auth Level | Payload Format | 
| ----- | ----- | ----- | ----- | ----- | 
| `POST` | `/api/auth/login` | Authenticate and issue secure session | **Public** | `application/json` | 
| `POST` | `/api/incidents` | Submit emergency report with EXIF data | **Citizen** | `multipart/form-data` | 
| `GET` | `/api/incidents` | Retrieve paginated queue of incidents | **Admin / Team** | Query Params | 
| `PATCH` | `/api/incidents/:id` | Update status, severity, or team assignment | **Admin** | `application/json` | 
| `GET` | `/api/gis/map-token` | Securely fetch Mapbox access token | **Internal** | None | 

## 🛠️ Installation & Local Deployment

### Prerequisites

* Node.js (v18.x or higher)

* PostgreSQL (v14.x or higher)

* Mapbox Developer Account (For Access Token)

### Execution Steps

1. **Clone the Repository**

   ```
   git clone https://github.com/your-org/ResQGrid.git
   cd ResQGrid
   
   ```

2. **Install Node Dependencies**

   ```
   npm install
   
   ```

3. **Environment Configuration**
   Create a `.env` file in the project root:

   ```
   PORT=3000
   NODE_ENV=development
   DATABASE_URL=postgres://username:password@localhost:5432/resqgrid
   SESSION_SECRET=your_cryptographically_secure_secret
   MAPBOX_ACCESS_TOKEN=pk.your_mapbox_token_here
   
   ```

4. **Initialize Database & Seed Data**
   Run the migration script followed by the seed script to populate realistic demonstration data (centered around Chennai, TN).

   ```
   npm run db:migrate
   npm run db:seed
   
   ```

5. **Start the Development Server**

   ```
   npm run dev
   
   ```

   *The application will be available at `http://localhost:3000`.*

## 📂 Project Structure

```
ResQGrid/
├── public/                  # Static Vanilla assets (Zero-Bloat)
│   ├── css/                 # Native CSS custom properties and layouts
│   ├── js/                  # ES6 modules, Mapbox initialization, EXIF parsing
│   └── assets/              # Compressed UI graphics and SVG icons
├── src/
│   ├── controllers/         # Business logic and Prioritization algorithms
│   ├── middleware/          # RBAC enforcement, Auth, Rate-limiting
│   ├── models/              # PostgreSQL schema interactions
│   └── routes/              # Express API endpoint definitions
├── database/                # SQL migrations and Chennai region seed scripts
├── .env.example             # Environment variable template
├── package.json             # Dependency manifest
└── README.md                # System documentation

```

## 📜 License

This software is released under the [MIT License](LICENSE).