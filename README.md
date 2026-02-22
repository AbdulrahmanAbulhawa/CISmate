# CISmate — Backend (Spring Boot, Multi-Module)

Backend for **CISmate**, a university companion app with two roles: **Student** and **Admin**.

This repository contains the backend services (REST APIs) that power CISmate’s features. The project is built as a **multi-module Maven** setup where `runner` is the Spring Boot entry module and the other modules represent domains/features.

---

## What CISmate does

### Student
- **Home dashboard:** profile (name, year, GPA, completed hours, study plan)
- **Home menu tools:** print/export schedule, GPA calculator (utility), resume builder, profile update
- **Schedule generator (core):** generate next-semester schedules using filters (semester, year, difficulty, course count, electives count, elective tags, constraints)
- **Assistant:** chatbot for university/app questions
- **Explore:** courses ↔ professors (linked both ways)
- **Opportunities:** group-finding posts (no in-app messaging; contact info) + internships (admin-posted)
- **Careers:** browse/filter + **Best Fit** recommendation (based on grades per subject)
- **Calendar:** personal + college-wide events

### Admin
Manages users, courses, professors, careers, internships, and college events (visible to all students).

---

## Tech stack
- Java 21
- Spring Boot 3.5.x
- Spring Web
- Spring Data JPA
- PostgreSQL (pgvector image used for Spring AI vector store)
- Spring Security (JWT, stateless, role-based access)
- Spring AI + OpenAI (chatbot)
- Maven (multi-module)

---

## Project structure

CISmate/
- runner/ (Spring Boot entry point)
- Authentication/
- Calendar/
- Chat_Bot/
- Course_Professor/
- GPA/
- OpportunitiesBoard/
- Schedule/
- career/
- pom.xml

---

## Roles & authorization (high level)
- `ADMIN`: protected endpoints under `/api/admin/**`
- Other endpoints require a valid JWT (`Authorization: Bearer <token>`)

Public endpoints:
- `POST /api/register`
- `POST /login`
- `GET  /api/courses/getAllCourseNames`

