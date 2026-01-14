# CISmate – Backend

**CISmate** is an AI-powered academic planning backend built with **Spring Boot**, designed to help university students plan their academic journey, make informed course decisions, and track progress efficiently.

This repository contains the **backend services** that power CISmate’s core features.

---

## 🚀 Features Overview

CISmate is built as a modular backend, where each module is responsible for a specific domain:

### 🔐 Authentication
Handles user registration, login, and secure access to APIs using role-based authorization.

### 📅 Schedule
Generates optimized semester schedules based on prerequisites, credit limits, and academic constraints.

### 📊 GPA
Calculates GPA and cumulative GPA, with detailed grade breakdowns and academic performance insights.

### 🤖 Chat_Bot
AI-powered assistant that answers questions about courses, schedules, and academic planning using system data.

### 🎓 Course_Professor
Manages course and professor information, including difficulty level, assessments, labs, and learning resources.

### 💼 OpportunitiesBoard
Provides a board for internships and academic opportunities, with filtering and structured details.

### 🗓️ Calendar
Organizes academic events, reminders, and important dates linked to the student’s plan.

### 🧭 career
Offers career guidance content mapped to academic tracks, skills, and relevant courses.

### ▶️ runner
Main Spring Boot entry module that wires all services together and exposes REST APIs.

---

## 🛠️ Tech Stack

- **Java 21**
- **Spring Boot 3**
- **Spring Data JPA**
- **PostgreSQL**
- **Spring AI / OpenAI (Chatbot)**
- **Maven**
- **RESTful APIs**

---

## ⚙️ Project Structure

CISmate/
├── Authentication/
├── Calendar/
├── Chat_Bot/
├── Course_Professor/
├── GPA/
├── OpportunitiesBoard/
├── Schedule/
├── career/
├── runner/
└── pom.xml
