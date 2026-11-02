# CivicPulse: Level 3 DBMS Experiential Learning Project
**Multi-Paradigm Municipal Issue Redressal System (Relational SQL + Vector Database)**

* **Institution:** PES University
* **Course:** Database Management Systems (Experiential Learning – Level 3)
* **Team Members:**
  * Gautam Krishna (`PES2UG24CS169`)
  * Divyanshi Verma (`PES2UG24CS161`)

---

## 1. Executive Summary & Problem Domain

### 1.1 Problem Statement
Municipal corporations in metropolitan regions (such as Bengaluru) receive thousands of citizen complaints daily regarding civic issues: potholes, sewage overflows, defective streetlights, illegal garbage dumping, and broken storm drains. In conventional municipal portals, three critical systemic bottlenecks occur:
1. **Manual Routing & Bottlenecks:** Incoming complaints languish unassigned because supervisors must manually determine which field engineer has capacity.
2. **Flooding by Redundant Duplicates:** Multiple residents in the same neighborhood independently report the exact same pothole or burst pipe using different wording (e.g., *"water pooling on road"* vs. *"burst pipeline flooding asphalt"*). Traditional keyword-based searches miss these semantic equivalents, clogging queues with duplicates.
3. **Absence of Enforceable SLAs & Audit Integrity:** Category-specific Service Level Agreements (SLAs) are rarely enforced automatically at the data tier, and status changes lack an immutable tamper-proof audit trail.

### 1.2 The CivicPulse Solution
CivicPulse resolves all three bottlenecks directly within the database architecture by combining two database paradigms:
1. **Primary Relational Database (MySQL 8.0 / InnoDB):** Provides ACID transactional integrity, foreign key referential enforcement, database-level check constraints, stored procedures for workload-balanced routing, and automated triggers that derive SLA deadlines and generate immutable audit logs.
2. **Secondary Vector Database (128-Dimensional Cosine Vector Index):** Employs dense vector embeddings and cosine similarity search to detect semantic duplicates before redundant filing, allowing citizens to upvote existing issues.

---

## 2. Multi-Paradigm Database Justification

| Database Paradigm | Technology Used | Target Workload & Justification |
| :--- | :--- | :--- |
| **Relational (SQL)** | **MySQL 8.0 (InnoDB)** | **Transactional & Operational Core:** Requires strict ACID properties, relational consistency across 11 normalized tables, foreign keys with cascading rules, database-level triggers, and atomic stored procedures. A routing transaction must atomically inspect capacity, update load counters, and transition ticket status. |
| **Vector Database** | **128-D Dense Vector Store with Cosine Index** | **Unstructured Semantic Retrieval:** Civic complaints are written in unstructured free-form natural language. Keyword search (`LIKE '%...%'`) fails when synonyms or varied phrasings describe the same physical reality. Dense embeddings map textual meaning into continuous space, allowing instant duplicate clustering ($> 0.60$ cosine similarity). |

---

## 3. Vector Database & Semantic Search Specification (Option 2 Rubric)

### 3.1 What Data is Converted into Embeddings
The unstructured text fields of each civic report—specifically the concatenation of `title`, `description`, and issue category—are transformed into vector embeddings.

### 3.2 Embedding Approach & Model
* **Model Type:** Deterministic subword, character $n$-gram ($n=3, 4$), and domain-concept semantic projection.
* **Vector Dimensionality:** $D = 128$ dimensions ($\mathbf{v} \in \mathbb{R}^{128}$).
* **Normalization:** Every vector is $L_2$-normalized such that:
  $$\|\mathbf{v}\|_2 = \sqrt{\sum_{i=1}^{128} v_i^2} = 1.0$$
* **Domain Lexical Anchors:** Civic semantic vocabulary clusters (e.g., *pothole/asphalt/crater*, *sewage/drain/overflow*, *garbage/trash/dump*, *streetlight/dark/power*) are mapped to dedicated coordinate sub-spaces to capture municipal domain semantics without cloud API latency.

### 3.3 Storage Strategy
* Vectors are maintained in a persistent collection (`data/vector_store.json`) indexed by `complaint_id`, `ward_id`, and `category_id`.
* Synchronized with MySQL relational table `complaint_embeddings` (`complaint_id`, `model_name`, `dimensions`, `embedding_json`, `created_at`).

### 3.4 Similarity Metric
Retrieval evaluates the **Cosine Similarity** between query vector $\mathbf{q}$ and stored complaint vector $\mathbf{d}$:
$$\text{CosineSimilarity}(\mathbf{q}, \mathbf{d}) = \frac{\mathbf{q} \cdot \mathbf{d}}{\|\mathbf{q}\|_2 \|\mathbf{d}\|_2}$$
Because all vectors are pre-normalized to unit length ($\|\mathbf{q}\|_2 = 1$, $\|\mathbf{d}\|_2 = 1$), cosine similarity simplifies directly to the inner dot product:
$$\text{CosineSimilarity}(\mathbf{q}, \mathbf{d}) = \sum_{i=1}^{128} q_i \cdot d_i$$
Scores range from $0.0$ (orthogonal/unrelated) to $1.0$ (identical meaning).

### 3.5 Retrieval & Duplicate Clustering Strategy
1. **Scoped Query:** When a resident inputs a grievance, the query embedding $\mathbf{q}$ is computed.
2. **Spatial Scoping:** Results are filtered by `ward_id` (since municipal issues are localized to neighborhoods).
3. **Threshold Classification:**
   * $\ge 0.75$: High-confidence semantic duplicate (prominent alert with upvote option).
   * $0.55 - 0.74$: Potential related issue.
   * $< 0.55$: Distinct issue (proceeds to insert).

---

## 4. Database Schema & Data Dictionary

### 4.1 Master & Reference Tables
1. **`wards`**: Municipal administrative zones (e.g., Ward 174 HSR Layout, Ward 150 Bellandur).
   * `ward_id` (PK, INT AUTO_INCREMENT), `ward_number` (UNIQUE INT), `ward_name` (VARCHAR), `zone` (VARCHAR), `population` (INT).
2. **`departments`**: Civic authorities (Road Infrastructure, BWSSB, BESCOM, Solid Waste Management).
   * `department_id` (PK), `department_name` (UNIQUE VARCHAR), `contact_email`, `helpline`.
3. **`issue_categories`**: Taxonomies specifying SLA rules and default priorities.
   * `category_id` (PK), `category_name`, `department_id` (FK → departments), `sla_hours` (INT CHECK > 0), `default_priority` (CHECK IN ('low','medium','high','critical')).

### 4.2 Personnel & Access Control Tables
4. **`users`**: Multi-role user identity store.
   * `user_id` (PK), `full_name`, `email` (UNIQUE), `phone`, `password_hash`, `role` (CHECK IN ('citizen','supervisor','staff','admin')), `ward_id` (FK → wards).
5. **`staff_profiles`**: Specialization extension of `users` (1-to-1 relationship).
   * `staff_id` (PK), `user_id` (UNIQUE FK → users), `department_id` (FK → departments), `designation`, `active_load` (INT DEFAULT 0 CHECK >= 0).

### 4.3 Operational & Lifecycle Tables
6. **`complaints`**: Core grievance table with FULLTEXT index and trigger hooks.
   * `complaint_id` (PK), `citizen_id` (FK → users), `category_id` (FK → issue_categories), `ward_id` (FK → wards), `title`, `description`, `latitude`, `longitude`, `status` (CHECK IN ('open','assigned','in_progress','resolved','closed','rejected')), `priority`, `reported_at`, `sla_due_at`, `resolved_at`.
7. **`assignments`**: Task dispatch records.
   * `assignment_id` (PK), `complaint_id` (FK → complaints), `staff_id` (FK → staff_profiles), `assigned_at`, `is_active` (BOOLEAN).
8. **`status_history`**: Immutable audit trail written exclusively by database triggers.
   * `history_id` (PK), `complaint_id` (FK → complaints), `old_status`, `new_status`, `changed_at`, `remarks`.
9. **`citizen_feedback`**: Post-resolution feedback.
   * `feedback_id` (PK), `complaint_id` (FK → complaints), `citizen_id` (FK → users), `rating` (INT CHECK BETWEEN 1 AND 5), `comments`, `created_at`.
10. **`complaint_upvotes`**: Citizen engagement to consolidate duplicates without extra tickets.
    * `complaint_id` (FK), `user_id` (FK), `upvoted_at`, PRIMARY KEY (`complaint_id`, `user_id`).
11. **`complaint_embeddings`**: SQL-side vector store mirror.
    * `complaint_id` (PK, FK), `model_name`, `dimensions`, `embedding_json`, `created_at`.

---

## 5. Demonstration of the 5 Advanced DBMS Concepts

### Feature 1: Database Triggers (Automatic SLA Calculation & Immutable Audit)
* **`trg_complaints_before_insert`**: On every new complaint, reads `sla_hours` and `default_priority` from `issue_categories` and derives `sla_due_at = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL sla_hours HOUR)`.
* **`trg_complaints_before_update`**: Detects when `status` transitions to `'resolved'` and stamps `resolved_at = CURRENT_TIMESTAMP`.
* **`trg_complaints_after_update`**: Automatically inserts a row into `status_history` logging the previous state, new state, and timestamp, guaranteeing audit trail integrity even if application code bypasses logging.

### Feature 2: Stored Procedure & Workload-Balanced Routing (`sp_auto_assign_complaint`)
* Executes an atomic routine taking `p_complaint_id` and `p_department_id`.
* Queries `staff_profiles` in the owning department ordered by `active_load ASC` to select the least-loaded available engineer.
* Atomically deactivates previous assignments, creates an active assignment, increments officer `active_load = active_load + 1`, and transitions complaint status to `'assigned'`.

### Feature 3: Vector Similarity Search & Duplicate Detection (Option 2)
* Evaluates 128-dimensional dense embeddings against existing complaints using cosine similarity.
* Prevents redundant tickets by alerting citizens before insert and offering 1-click upvoting of the parent ticket.

### Feature 4: Full-Text Search (`MATCH ... AGAINST`)
* MySQL FULLTEXT index `ft_complaints_title_desc (title, description)` used by procedure `sp_find_similar_complaints` to demonstrate natural language keyword retrieval alongside vector embeddings.

### Feature 5: Multi-Table Analytical Views & Aggregations
* Real-time aggregation queries utilizing `JOIN`, `GROUP BY`, `COUNT`, `SUM`, and conditional `CASE` expressions to compute:
  * Ward-wise resolution ratios and open backlog counts.
  * SLA breach counts (`NOW() > sla_due_at AND status <> 'resolved'`).
  * Departmental staff distribution and ticket load.

---

## 6. Role-Based Access Control (RBAC)

The application enforces a minimum of two distinct roles:

| Feature / Action | Citizen Role (`Gautam Sharma`, Ward 174) | Municipal Admin / Staff Role (`System Administrator`) |
| :--- | :---: | :---: |
| **Browse Grievance Board** | ✅ Yes (with "My Reports" filter) | ✅ Yes (Full municipal view) |
| **File Grievance with Vector AI Check** | ✅ Yes | ❌ (Staff triage issues) |
| **Upvote Existing Duplicate Tickets** | ✅ Yes | ❌ |
| **Submit Post-Resolution 1-5 Star Rating** | ✅ Yes | ❌ |
| **Trigger `sp_auto_assign_complaint` Procedure** | ❌ Blocked | ✅ Yes (1-Click Auto-Routing) |
| **Update Complaint Status & Audit Trigger** | ❌ Blocked | ✅ Yes (Open → In Progress → Resolved) |
| **Ward SLA & Department Analytics View** | ❌ Blocked | ✅ Yes |
| **Vector DB Studio & SQL Sync** | ✅ Test Queries | ✅ Full Diagnostic & Sync Controls |

---

## 7. Setup & Execution Instructions

### Prerequisites
* Node.js 18+ (tested on Node v20/v22)
* MySQL 8.0 server (local or remote)

### Step 1: Clone Repository & Install Dependencies
```bash
git clone https://github.com/<your-repo>/civicpulse.git
cd civicpulse-app
npm install
```

### Step 2: Configure Environment Variables
Create or verify `.env.local`:
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=civicpulse
```

### Step 3: Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your web browser.

### Step 4: Initialize Database & Vector Embeddings
1. Navigate to the **"DB & Schema"** tab in the navigation bar.
2. Click **"Initialize / Reload Database Seeds"**. This automatically:
   * Executes the full DDL (`civicpulse_ddl_mysql.sql`).
   * Loads sample Bangalore municipal data (`civicpulse_seed_data.sql`).
   * Generates and stores 128-D vector embeddings for all complaints into the Vector Database collection.

---

## 8. Step-by-Step Viva Demonstration Script

1. **Demonstrate Role-Based Access Control (RBAC):**
   * Use the Persona toggle in the navbar to switch between **Citizen** and **Admin/Staff**.
   * Note how citizen mode provides reporting and personal issue tracking, whereas admin mode exposes the triage desk and analytics.

2. **Demonstrate Vector AI Duplicate Detection:**
   * In Citizen mode, click **"Report Grievance"**.
   * Select **Ward 174 (HSR Layout)** and type Title: *"deep road crater near club"*.
   * Observe the live amber **Vector Database Match Alert** showing complaint #1 (*"Deep pothole on 27th Main near HSR Club"*) matched with $> 65\%$ Cosine Similarity.
   * Click **"Upvote Existing"** to illustrate duplicate prevention.

3. **Demonstrate Database Triggers:**
   * Submit a distinct complaint (e.g. *"Broken water pipeline on 5th cross"* under BWSSB).
   * Note that the `BEFORE INSERT` trigger automatically calculates and populates the `sla_due_at` timestamp and priority from the category metadata without user input.

4. **Demonstrate Stored Procedure Auto-Routing:**
   * Switch persona to **Admin/Staff** and navigate to **"Admin Triage"**.
   * Click **"Auto-Assign (Stored Procedure)"** on an open ticket.
   * The system executes `CALL sp_auto_assign_complaint(id, dept_id)`, finding the officer with the lowest `active_load` and moving the ticket to `'assigned'` atomically.

5. **Demonstrate Status Change Trigger & Audit History:**
   * Open the complaint detail modal and update status to `'in_progress'` or `'resolved'`.
   * Note that the `AFTER UPDATE` trigger automatically appends a new audit record to the `status_history` timeline, and `'resolved'` stamps `resolved_at`.

6. **Demonstrate Vector Studio (Option 2):**
   * Click the **"Vector DB Studio"** tab.
   * Enter test natural language queries (e.g., *"stagnant water pooling"*), adjust the cosine similarity threshold slider, and inspect the ranked nearest neighbors with query latency $< 2\text{ ms}$.

