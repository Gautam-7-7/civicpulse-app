-- =====================================================================
-- CivicPulse - Comprehensive Seed Data Script for MySQL 8.0
-- =====================================================================

USE civicpulse;

-- Disable FK checks temporarily for clean seeding
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM citizen_feedback;
DELETE FROM status_history;
DELETE FROM assignments;
DELETE FROM complaints;
DELETE FROM staff_profiles;
DELETE FROM users;
DELETE FROM issue_categories;
DELETE FROM departments;
DELETE FROM wards;

ALTER TABLE wards AUTO_INCREMENT = 1;
ALTER TABLE departments AUTO_INCREMENT = 1;
ALTER TABLE issue_categories AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE staff_profiles AUTO_INCREMENT = 1;
ALTER TABLE complaints AUTO_INCREMENT = 1;
ALTER TABLE assignments AUTO_INCREMENT = 1;
ALTER TABLE status_history AUTO_INCREMENT = 1;
ALTER TABLE citizen_feedback AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. WARDS (Bangalore Municipal Wards)
INSERT INTO wards (ward_number, ward_name, zone, population) VALUES
(174, 'HSR Layout', 'South Zone', 68500),
(150, 'Bellandur', 'Mahadevapura Zone', 82400),
(151, 'Koramangala', 'South Zone', 54200),
(149, 'Varthur', 'Mahadevapura Zone', 61200),
(176, 'BTM Layout', 'South Zone', 73900),
(160, 'Indiranagar', 'East Zone', 49800);

-- 2. DEPARTMENTS
INSERT INTO departments (department_name, contact_email, helpline) VALUES
('Road Infrastructure & Traffic', 'roads@civicpulse.gov.in', '080-22660001'),
('Water Supply & Sewerage (BWSSB)', 'water@civicpulse.gov.in', '1916'),
('Solid Waste & Sanitation', 'sanitation@civicpulse.gov.in', '080-22660003'),
('Electricity & Street Lighting (BESCOM)', 'electricity@civicpulse.gov.in', '1912'),
('Public Health & Vector Control', 'health@civicpulse.gov.in', '080-22660005');

-- 3. ISSUE CATEGORIES
INSERT INTO issue_categories (category_name, department_id, sla_hours, default_priority) VALUES
('Pothole / Damaged Road Surface', 1, 48, 'high'),
('Caved-in Footpath / Manhole Cover', 1, 24, 'critical'),
('Water Pipeline Leak / Contamination', 2, 24, 'high'),
('Sewage Overflow / Blocked Drain', 2, 12, 'critical'),
('Garbage Dump / Overflowing Bins', 3, 12, 'high'),
('Dead Animal Removal', 3, 6, 'critical'),
('Streetlight Non-Functional / Flickering', 4, 24, 'medium'),
('Loose Hanging Power Cable', 4, 6, 'critical'),
('Stagnant Water / Mosquito Hazard', 5, 48, 'medium');

-- 4. USERS (Citizens, Staff, Admin)
-- Password for all seed users is 'password123' (SHA256 hashed or mock hash)
-- Note: ward_id references wards.ward_id (1=HSR, 2=Bellandur, 3=Koramangala, 4=Varthur, etc.)
INSERT INTO users (full_name, email, phone, password_hash, role, ward_id) VALUES
('System Administrator', 'admin@civicpulse.gov.in', '9876543210', 'scrypt_or_sha256_mock_admin', 'admin', 1),
('Rajesh Kumar (Roads Inspector)', 'rajesh.kumar@bbmp.gov.in', '9811223344', 'scrypt_or_sha256_mock_staff', 'staff', 1),
('Anand Murthy (BWSSB Engineer)', 'anand.murthy@bwssb.gov.in', '9822334455', 'scrypt_or_sha256_mock_staff', 'staff', 2),
('Priya Sharma (BESCOM Linesman)', 'priya.sharma@bescom.gov.in', '9833445566', 'scrypt_or_sha256_mock_staff', 'staff', 3),
('Suresh Patil (Sanitation Officer)', 'suresh.patil@bbmp.gov.in', '9844556677', 'scrypt_or_sha256_mock_staff', 'staff', 1),
('Gautam Sharma (Citizen)', 'gautam@example.com', '9988776655', 'scrypt_or_sha256_mock_citizen', 'citizen', 1),
('Rohit Verma (Citizen)', 'rohit.v@example.com', '9977665544', 'scrypt_or_sha256_mock_citizen', 'citizen', 2),
('Sneha Patel (Citizen)', 'sneha.p@example.com', '9966554433', 'scrypt_or_sha256_mock_citizen', 'citizen', 3),
('Dr. Ramesh Rao (Supervisor)', 'ramesh.supervisor@bbmp.gov.in', '9900112233', 'scrypt_or_sha256_mock_super', 'supervisor', 1);

-- 5. STAFF PROFILES
INSERT INTO staff_profiles (user_id, department_id, designation, active_load) VALUES
(2, 1, 'Assistant Executive Engineer - Roads', 2),
(3, 2, 'Field Supervisor - Water Works', 1),
(4, 4, 'Junior Technical Officer - Power', 1),
(5, 3, 'Ward Sanitation Inspector', 0);

-- 6. COMPLAINTS
-- Complaint 1: Pothole in HSR Layout (Assigned)
INSERT INTO complaints (citizen_id, category_id, ward_id, title, description, latitude, longitude, status, priority, reported_at, sla_due_at) VALUES
(6, 1, 1, 'Deep pothole on 27th Main near HSR Club', 'A dangerous 2-foot wide pothole has formed following recent rains. Multiple two-wheeler riders have skidded.', 12.911600, 77.653400, 'assigned', 'high', NOW() - INTERVAL 10 HOUR, NOW() + INTERVAL 38 HOUR);

-- Complaint 2: Sewage Overflow in Bellandur (In Progress)
INSERT INTO complaints (citizen_id, category_id, ward_id, title, description, latitude, longitude, status, priority, reported_at, sla_due_at) VALUES
(7, 4, 2, 'Sewage overflow near Bellandur Lake outer gate', 'Underground sewer pipe backed up and black water is pooling on the pedestrian pathway. Strong foul odor.', 12.934800, 77.678900, 'in_progress', 'critical', NOW() - INTERVAL 6 HOUR, NOW() + INTERVAL 6 HOUR);

-- Complaint 3: Streetlights out in Koramangala 4th Block (Open)
INSERT INTO complaints (citizen_id, category_id, ward_id, title, description, latitude, longitude, status, priority, reported_at, sla_due_at) VALUES
(8, 7, 3, 'Consecutive 5 streetlights dark on 80 Feet Road', 'The whole stretch of 80ft road near Maharaja junction has no working lights since yesterday night.', 12.935200, 77.624500, 'open', 'medium', NOW() - INTERVAL 3 HOUR, NOW() + INTERVAL 21 HOUR);

-- Complaint 4: Garbage heap on 14th Main HSR (Resolved)
INSERT INTO complaints (citizen_id, category_id, ward_id, title, description, latitude, longitude, status, priority, reported_at, sla_due_at, resolved_at) VALUES
(6, 5, 1, 'Illegal commercial garbage dumping near park boundary', 'Unsegregated commercial food waste and plastic bags were dumped next to Sector 7 children park.', 12.916500, 77.648200, 'resolved', 'high', NOW() - INTERVAL 26 HOUR, NOW() - INTERVAL 14 HOUR, NOW() - INTERVAL 4 HOUR);

-- Complaint 5: Broken manhole lid in Varthur (Open)
INSERT INTO complaints (citizen_id, category_id, ward_id, title, description, latitude, longitude, status, priority, reported_at, sla_due_at) VALUES
(7, 2, 4, 'Cracked concrete slab on storm water drain', 'Pedestrians at risk of falling into 6-foot drain near government primary school.', 12.941200, 77.746500, 'open', 'critical', NOW() - INTERVAL 1 HOUR, NOW() + INTERVAL 23 HOUR);

-- 7. ASSIGNMENTS
INSERT INTO assignments (complaint_id, staff_id, assigned_at, is_active) VALUES
(1, 1, NOW() - INTERVAL 9 HOUR, TRUE),
(2, 2, NOW() - INTERVAL 5 HOUR, TRUE),
(4, 4, NOW() - INTERVAL 24 HOUR, FALSE);

-- 8. STATUS HISTORY
INSERT INTO status_history (complaint_id, old_status, new_status, changed_at, remarks) VALUES
(1, 'open', 'assigned', NOW() - INTERVAL 9 HOUR, 'Auto-assigned to Rajesh Kumar (Roads Infrastructure)'),
(2, 'open', 'assigned', NOW() - INTERVAL 5 HOUR, 'Assigned to Anand Murthy for urgent field inspection'),
(2, 'assigned', 'in_progress', NOW() - INTERVAL 4 HOUR, 'Jetting machine deployed to clear block'),
(4, 'open', 'assigned', NOW() - INTERVAL 24 HOUR, 'Assigned to Ward Sanitation staff'),
(4, 'assigned', 'in_progress', NOW() - INTERVAL 12 HOUR, 'Cleaning crew dispatched with compactor truck'),
(4, 'in_progress', 'resolved', NOW() - INTERVAL 4 HOUR, 'Site cleared and bleached; waste removed to processing plant');

-- 9. CITIZEN FEEDBACK
INSERT INTO citizen_feedback (complaint_id, citizen_id, rating, comments) VALUES
(4, 6, 5, 'Quick action taken by the sanitation department within 24 hours. The area is clean now!');

COMMIT;
