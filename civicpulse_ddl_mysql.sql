

CREATE DATABASE IF NOT EXISTS civicpulse;
USE civicpulse;


SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS citizen_feedback;
DROP TABLE IF EXISTS status_history;
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS complaints;
DROP TABLE IF EXISTS staff_profiles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS issue_categories;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS wards;
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- 1. REFERENCE / MASTER TABLES
-- =====================================================================

CREATE TABLE wards (
    ward_id      INT AUTO_INCREMENT PRIMARY KEY,
    ward_number  INT UNIQUE NOT NULL,
    ward_name    VARCHAR(100) NOT NULL,
    zone         VARCHAR(50),
    population   INT CHECK (population >= 0),
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE departments (
    department_id   INT AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(100) UNIQUE NOT NULL,
    contact_email   VARCHAR(150),
    helpline        VARCHAR(20),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE issue_categories (
    category_id       INT AUTO_INCREMENT PRIMARY KEY,
    category_name     VARCHAR(100) NOT NULL,
    department_id     INT NOT NULL,
    sla_hours         INT NOT NULL CHECK (sla_hours > 0),
    default_priority  VARCHAR(10) NOT NULL DEFAULT 'medium'
                       CHECK (default_priority IN ('low','medium','high','critical')),
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_category_department FOREIGN KEY (department_id)
        REFERENCES departments(department_id)
) ENGINE=InnoDB;

-- =====================================================================
-- 2. PEOPLE
-- =====================================================================

CREATE TABLE users (
    user_id        INT AUTO_INCREMENT PRIMARY KEY,
    full_name      VARCHAR(100) NOT NULL,
    email          VARCHAR(150) UNIQUE NOT NULL,
    phone          VARCHAR(15),
    password_hash  VARCHAR(255) NOT NULL,
    role           VARCHAR(15) NOT NULL
                    CHECK (role IN ('citizen','supervisor','staff','admin')),
    ward_id        INT,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_ward FOREIGN KEY (ward_id)
        REFERENCES wards(ward_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE staff_profiles (
    staff_id       INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT NOT NULL UNIQUE,
    department_id  INT NOT NULL,
    designation    VARCHAR(60),
    active_load    INT NOT NULL DEFAULT 0 CHECK (active_load >= 0),
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_staff_user FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_staff_department FOREIGN KEY (department_id)
        REFERENCES departments(department_id)
) ENGINE=InnoDB;

-- =====================================================================
-- 3. COMPLAINT LIFECYCLE
-- =====================================================================

CREATE TABLE complaints (
    complaint_id   INT AUTO_INCREMENT PRIMARY KEY,
    citizen_id     INT NOT NULL,
    category_id    INT NOT NULL,
    ward_id        INT NOT NULL,
    title          VARCHAR(200) NOT NULL,
    description    TEXT NOT NULL,
    latitude       DECIMAL(9,6),
    longitude      DECIMAL(9,6),
    status         VARCHAR(15) NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','assigned','in_progress','resolved','closed','rejected')),
    priority       VARCHAR(10)
                    CHECK (priority IN ('low','medium','high','critical')),
    reported_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sla_due_at     TIMESTAMP NULL,
    resolved_at    TIMESTAMP NULL,
    CONSTRAINT fk_complaints_citizen FOREIGN KEY (citizen_id)
        REFERENCES users(user_id),
    CONSTRAINT fk_complaints_category FOREIGN KEY (category_id)
        REFERENCES issue_categories(category_id),
    CONSTRAINT fk_complaints_ward FOREIGN KEY (ward_id)
        REFERENCES wards(ward_id),
    FULLTEXT KEY ft_complaints_title_desc (title, description)
) ENGINE=InnoDB;

CREATE INDEX idx_complaints_ward   ON complaints (ward_id);
CREATE INDEX idx_complaints_status ON complaints (status);

CREATE TABLE assignments (
    assignment_id  INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id   INT NOT NULL,
    staff_id       INT NOT NULL,
    assigned_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_assignments_complaint FOREIGN KEY (complaint_id)
        REFERENCES complaints(complaint_id) ON DELETE CASCADE,
    CONSTRAINT fk_assignments_staff FOREIGN KEY (staff_id)
        REFERENCES staff_profiles(staff_id)
) ENGINE=InnoDB;

CREATE TABLE status_history (
    history_id     INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id   INT NOT NULL,
    old_status     VARCHAR(15),
    new_status     VARCHAR(15) NOT NULL,
    changed_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    remarks        TEXT,
    CONSTRAINT fk_history_complaint FOREIGN KEY (complaint_id)
        REFERENCES complaints(complaint_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE citizen_feedback (
    feedback_id    INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id   INT NOT NULL,
    citizen_id     INT NOT NULL,
    rating         INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comments       TEXT,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_feedback_complaint FOREIGN KEY (complaint_id)
        REFERENCES complaints(complaint_id) ON DELETE CASCADE,
    CONSTRAINT fk_feedback_citizen FOREIGN KEY (citizen_id)
        REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 4. TRIGGERS
-- =====================================================================

DROP TRIGGER IF EXISTS trg_complaints_before_insert;
DROP TRIGGER IF EXISTS trg_complaints_before_update;
DROP TRIGGER IF EXISTS trg_complaints_after_update;
DROP PROCEDURE IF EXISTS sp_auto_assign_complaint;
DROP PROCEDURE IF EXISTS sp_find_similar_complaints;

DELIMITER $$

-- 4a. BEFORE INSERT on complaints: derive priority + SLA due date from category
CREATE TRIGGER trg_complaints_before_insert
BEFORE INSERT ON complaints
FOR EACH ROW
BEGIN
    DECLARE v_sla_hours INT;
    DECLARE v_default_priority VARCHAR(10);

    SELECT sla_hours, default_priority
      INTO v_sla_hours, v_default_priority
      FROM issue_categories
     WHERE category_id = NEW.category_id;

    IF NEW.priority IS NULL THEN
        SET NEW.priority = v_default_priority;
    END IF;

    IF NEW.reported_at IS NULL THEN
        SET NEW.reported_at = CURRENT_TIMESTAMP;
    END IF;

    SET NEW.sla_due_at = DATE_ADD(NEW.reported_at, INTERVAL v_sla_hours HOUR);
END$$

-- 4b. BEFORE UPDATE on complaints: stamp resolved_at
CREATE TRIGGER trg_complaints_before_update
BEFORE UPDATE ON complaints
FOR EACH ROW
BEGIN
    IF NEW.status <> OLD.status AND NEW.status = 'resolved' AND OLD.resolved_at IS NULL THEN
        SET NEW.resolved_at = CURRENT_TIMESTAMP;
    END IF;
END$$

-- 4c. AFTER UPDATE on complaints: log status_history
--     (split from 4b because MySQL cannot INSERT into another table
--      from a BEFORE trigger and modify NEW in the same statement safely
--      the way Postgres allows -- AFTER is the reliable pattern here)
CREATE TRIGGER trg_complaints_after_update
AFTER UPDATE ON complaints
FOR EACH ROW
BEGIN
    IF NEW.status <> OLD.status THEN
        INSERT INTO status_history (complaint_id, old_status, new_status, remarks)
        VALUES (OLD.complaint_id, OLD.status, NEW.status,
                CONCAT('Status changed from ', OLD.status, ' to ', NEW.status));
    END IF;
END$$

DELIMITER ;

-- =====================================================================
-- 5. STORED PROCEDURE: auto-assign a complaint to the least-loaded
--    active staff member in the given department
-- =====================================================================

DELIMITER $$

CREATE PROCEDURE sp_auto_assign_complaint (
    IN p_complaint_id  INT,
    IN p_department_id INT
)
BEGIN
    DECLARE v_staff_id INT;

    SELECT staff_id INTO v_staff_id
      FROM staff_profiles
     WHERE department_id = p_department_id
     ORDER BY active_load ASC, staff_id ASC
     LIMIT 1;

    IF v_staff_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'No staff available in this department';
    END IF;

    INSERT INTO assignments (complaint_id, staff_id, is_active)
    VALUES (p_complaint_id, v_staff_id, TRUE);

    UPDATE staff_profiles
       SET active_load = active_load + 1
     WHERE staff_id = v_staff_id;

    UPDATE complaints
       SET status = 'assigned'
     WHERE complaint_id = p_complaint_id;
END$$

DELIMITER ;

-- =====================================================================
-- 6. PROCEDURE: full-text duplicate / similar-complaint detection
--    (MySQL has no table-returning FUNCTION like Postgres, so this is
--     a PROCEDURE that returns a result set -- call it with CALL)
-- =====================================================================

DELIMITER $$

CREATE PROCEDURE sp_find_similar_complaints (
    IN p_exclude_complaint_id INT,
    IN p_search_text          VARCHAR(500)
)
BEGIN
    SELECT c.complaint_id,
           c.title,
           c.status,
           MATCH(c.title, c.description) AGAINST (p_search_text IN NATURAL LANGUAGE MODE) AS similarity
      FROM complaints c
     WHERE c.complaint_id <> p_exclude_complaint_id
       AND MATCH(c.title, c.description) AGAINST (p_search_text IN NATURAL LANGUAGE MODE)
     ORDER BY similarity DESC;
END$$

DELIMITER ;

