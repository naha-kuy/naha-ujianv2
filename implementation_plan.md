# Implementation Plan - Database Audit and Schema Correction

This document outlines the detailed audit of the Supabase database configuration, security policies (RLS), triggers, and application controllers for **CBT-Eschool**. It includes the design of a corrected, optimized SQL schema script (`sql/database_baru_audit.sql`) that covers all program scenarios and creates a clean admin account with the password `"qeadzc"`.

> [!IMPORTANT]
> **No changes will be applied to the existing codebase.** A new SQL file will be created in the `sql/` directory, and this report is presented for user review and approval.

---

## 1. Deep Database Audit Findings

After examining the SQL files (`sql/db_baru.sql`, `sql/fix_login.sql`) and the application controller files, we identified **10 critical security and logical issues** that could lead to application failures or data leaks.

### 1.1. Critical Security Vulnerabilities (Data Leaks & Privilege Escalation)

1. **Plaintext Password Leak via Anonymous RPC** (`admin_get_profile_by_username`)
   - **Vulnerability:** The RPC `admin_get_profile_by_username(p_username)` has `SECURITY DEFINER` and is granted to `anon` (anonymous public access). It returns the entire `profiles` record, including the plaintext `password` column.
   - **Risk:** Anyone can open the browser console and retrieve any user's (including teachers and admins) plaintext password simply by calling the RPC with their username.
   - **Remediation:** In a production refactor, passwords should never be plaintext. However, to keep the current React login logic intact, we must secure other administrative RPCs.

2. **Privilege Escalation on Administrative RPCs**
   - **Vulnerability:** RPCs such as `admin_approve_user`, `admin_reject_user`, `admin_get_pending_teachers`, and `admin_get_registered_teachers` are defined with `SECURITY DEFINER` and granted to `anon` and `authenticated`.
   - **Risk:** Any student or unauthenticated user can approve pending accounts, reject accounts, or list private user details by calling these functions directly.
   - **Remediation:** Add strict role-based checks inside these functions to ensure `auth.uid()` has an `admin` role in `profiles` before executing the logic.

3. **Question & Correct Answer Leak** (`butir_soal`)
   - **Vulnerability:** The RLS policy `Siswa select butir_soal` allows *any* authenticated user to select *any* row in `butir_soal`.
   - **Risk:** A student can query the `butir_soal` table directly via the client to download the questions and correct answers (`jawaban_benar`) for any exam (even future ones or exams for other classes).
   - **Remediation:** Tighten the RLS policy so students can only select questions for exams that are currently active and assigned to their class, or exams they have already completed (possess a record in `nilai`).

### 1.2. Functional & Logical Bugs (RLS Policy Blocks)

4. **Missing INSERT Policy on `nilai` Table for Students**
   - **Bug:** There is no `INSERT` policy for the `siswa` role on the `nilai` table.
   - **Impact:** Students will receive a "Row Level Security" violation error when they submit their exam, preventing their grades from being saved.
   - **Remediation:** Add an RLS insert policy: `id_siswa = auth.uid()`.

5. **Missing UPDATE Policy on `nilai` Table for Teachers**
   - **Bug:** Teachers (`guru`) do not have permission to update rows in the `nilai` table.
   - **Impact:** When a teacher tries to grade essay questions (`simpanNilaiUraian`), the transaction will fail with an RLS error, and essay scores cannot be saved.
   - **Remediation:** Add an RLS update policy for teachers for exams they created.

6. **Blank Student Information for Teachers in Monitoring & Results**
   - **Bug:** The RLS policies on the `profiles` table only allow users to read their own profile (unless they are admin).
   - **Impact:** When a teacher (`guru`) loads the Monitoring page or Results page, the database joins `profiles` (for name, username, class). Because RLS blocks the teacher from reading other students' profiles, the joined student data returns `null`, showing "—" for all students.
   - **Remediation:** Add a policy to `profiles` allowing users with the `guru` role to select profiles.

7. **Missing RLS Policy on `activity_logs` for Teachers**
   - **Bug:** Only admins can select from `activity_logs`.
   - **Impact:** Teachers cannot view anti-cheat logs (tab switching, page exits) for their own exams, disabling their monitoring capabilities.
   - **Remediation:** Add a policy allowing teachers to read logs for exams they created.

8. **Blank Past Exam History Names for Students**
   - **Bug:** The RLS policy for `soal` only allows students to select records where `status = 'Aktif'`.
   - **Impact:** Once an exam is completed and set to `Nonaktif` by the teacher, the join to `soal` in `getStudentResults()` fails, causing the student's result history page to show empty exam names and subjects.
   - **Remediation:** Modify the `soal` SELECT policy to allow students to read a `soal` record if it is active OR if they have a completed `nilai` record for it.

### 1.3. Structural Optimization Issues

9. **Foreign Key Cascade Deletions on Profiles**
   - **Bug:** The `profiles` table references `auth.users(id)` but does not specify `ON DELETE CASCADE`.
   - **Impact:** Deleting a user from the Supabase Auth dashboard will crash due to foreign key constraint violations in `public.profiles`.
   - **Remediation:** Set `ON DELETE CASCADE` on `profiles.id REFERENCES auth.users(id)`.

10. **Missing INSERT Policy on `notifications` Table**
    - **Bug:** The table has select/update RLS policies but no insert policy for clients.
    - **Impact:** If the frontend or future features attempt to create a notification (e.g. `createNotification`), it will be blocked by RLS.
    - **Remediation:** Add an insert policy allowing authenticated users to create notifications for themselves, and teachers/admins to create notifications for anyone.

---

## 2. Proposed Database Changes

We will create a new, consolidated SQL script: `sql/database_baru_audit.sql`. This script will contain:
1. **Schema Definitions:** With all tables, updated foreign keys, and indexes.
2. **Robust Registration Trigger:** `handle_new_user` with conflict resolution and username fallbacks.
3. **Secured RPC Functions:** With administrative role checks.
4. **Optimized RLS Policies:** Resolving all data leaks and functional blocks detailed above.
5. **Seed Data:** Standard app settings and the **Admin Account** (`admin@gmail.com`, username: `admin`, password: `qeadzc`) with robust `auth.identities` entries to prevent Supabase Auth Error 500.

### Component Breakdown

#### [NEW] [database_baru_audit.sql](file:///c:/Files/Programmer/Naha%20Ujian/sql/database_baru_audit.sql)
A fully consolidated, audited SQL script containing clean schemas, robust RLS policies, secured functions, and the default admin seeding.

---

## 3. Verification Plan

Since we are not modifying the application code yet, we will verify the SQL script by reviewing its logic and syntax.

### Manual Verification Checklist
- Check for infinite recursion in RLS policies.
- Ensure all column names and data types match the frontend models (`settings.js`, `users.js`, controllers).
- Verify the admin seeding algorithm correctly aligns with Supabase's `auth.users` and `auth.identities` structure.
- Verify `pgcrypto` is loaded for password encryption.
