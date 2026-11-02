# CivicPulse: Municipal Grievance & SLA Management Platform
> **DBMS Experiential Learning – Level 3 Project**  
> **Team:** Gautam Krishna (`PES2UG24CS169`) & Divyanshi Verma (`PES2UG24CS161`)  
> **Stack:** Next.js 16 (App Router, TypeScript, Tailwind CSS) + MySQL 8.0 (ACID Relational) + Vector Database (128-D Cosine Index)

---

## 🌟 Overview
CivicPulse is a full-stack municipal issue management platform designed to eliminate the common failures of civic redressal portals:
1. **Automated SLA Derivation & Prioritization:** Category-specific deadlines and priorities derived automatically at insert via database triggers.
2. **Workload-Balanced Staff Routing:** Atomic stored procedure assigns complaints to the least-loaded municipal field engineer in the owning department.
3. **AI Semantic Duplicate Detection:** 128-dimensional vector similarity engine detects duplicate complaints in real-time, allowing citizens to upvote existing issues.
4. **Immutable Audit Trail:** All status changes are logged to an audit table by database triggers.

---

## 🏗️ Architecture & Database Paradigms (Option 2)

```
[ Citizen & Admin Client (Next.js 16) ]
                  │
                  ▼
[ Next.js App Router API Handlers (/api/*) ]
         │                              │
         ▼                              ▼
[ MySQL 8.0 (Relational SQL) ]   [ Vector Database (128-D) ]
• 11 Normalized Tables          • 128-D Continuous Embeddings
• Triggers (BEFORE & AFTER)     • Cosine Similarity ($u \cdot v$)
• Stored Procedures             • Subword & Domain Projections
• Complex GROUP BY Analytics    • Duplicate Clustering
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Edit `.env.local` with your MySQL credentials:
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=civicpulse
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Initialize Database & Vector Store
* Open the **"DB & Schema"** tab in the app.
* Click **"Initialize / Reload Database Seeds"**. This runs the full DDL, loads sample Bangalore municipal data, and generates vector embeddings.

---

## 📊 Features Implemented (Course Rubric)

* **Dual Paradigm Database (Option 2):** SQL (MySQL) + Vector Database (128-D dense embeddings with Cosine Similarity).
* **Triggers:**
  * `trg_complaints_before_insert`: Derives `sla_due_at` and default priority.
  * `trg_complaints_before_update`: Stamps `resolved_at` upon resolution.
  * `trg_complaints_after_update`: Writes immutable log to `status_history`.
* **Stored Procedures:**
  * `sp_auto_assign_complaint`: Atomic workload-balanced staff routing.
  * `sp_find_similar_complaints`: Full-text duplicate retrieval.
* **Role-Based Access Control (RBAC):**
  * **Citizen:** Report grievances with live duplicate alert, view own grievances, upvote existing reports.
  * **Admin/Staff:** Triage desk, 1-click stored procedure routing, status controller, analytics dashboard.
* **Vector Studio:** Dedicated diagnostic workspace to test natural language queries against the vector store with adjustable similarity thresholds.
