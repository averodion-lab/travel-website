# Product Requirements Document (PRD)
**Project:** Premium Camper & RV Rental Booking Platform
**Platform:** Web Application (Responsive Desktop & Mobile)

## 1. Project Overview
The objective is to build a robust, highly scalable camper rental website. The core engine is a self-serve booking and reservation system designed specifically for camper vans, travel trailers, and RVs. The platform emphasizes premium visuals—including 3D interactive models—and provides an exploratory map to inspire customers with full-hookup campsite destinations across the Southeastern United States.

## 2. Target Audience
*   Families, couples, and outdoor enthusiasts seeking camper rentals for road trips and nature retreats.
*   Travelers who require premium campground amenities (full RV hookups: electricity, sewage, fresh water).

## 3. Sitemap & Page Requirements

### 3.1. Home Page
*   **Hero Section:** High-resolution lifestyle visuals of campers in mountainous or lakefront locations, accompanied by a prominent "Book Your Camper" date-selection widget.
*   **3D Interactive Showcase:** Embedded, interactive 3D model of a flagship camper that users can rotate and zoom to explore the exterior and layout.
*   **Featured Fleet:** Quick-look cards for top-tier campers with starting prices and sleep capacities.

### 3.2. Destination Inspiration Map (Interactive Feature)
*   **Interactive Map UI:** A clickable, visual map restricted to Alabama, Georgia, Florida, North Carolina, South Carolina, and Tennessee.
*   **Curated Campsite Pins:** Map pins highlighting specific regional destinations (e.g., Beech Mountain, NC; Cheaha State Park, AL; Great Smoky Mountains, TN) that guarantee **Full Hookup RV Sites** (electricity, water, and sewage).
*   **Trip Context:** Clicking a pin displays a pop-up with a brief description of the destination and a direct link to "View Campers Suitable for this Trip."

### 3.3. Rentals (The Fleet / Inventory Page)
*   **List/Grid View:** Filter by Camper Class (e.g., Class B, Travel Trailer), Sleep Capacity, Towing Weight, and Price.
*   **Product Detail Page (PDP):**
    *   Detailed specifications: Dry weight, hitch requirements, length, and hookup compatibility.
    *   Included amenities (e.g., generator, kitchenette, bedding).
    *   **Booking Calendar Widget:** Real-time availability calendar specific to the viewed camper.

### 3.4. Services, About Us, Blog, & Contact
*   **Services:** Details on pickup/drop-off protocols, towing requirements, and insurance.
*   **Blog:** SEO-driven articles (e.g., "Top 5 Full-Hookup Sites in the Blue Ridge Mountains").
*   **Contact & FAQ:** Standard contact form and answers to common rental questions.

## 4. Core Feature: Booking & Reservation System
*   **Availability Engine:** Global calendar picker that queries the database to prevent overlapping double bookings for specific camper units.
*   **Dynamic Pricing:** Calculates `(Daily Rate * Number of Days)`. Includes logic for minimum rental periods, security deposits, and optional add-ons (e.g., premium insurance, portable generators, cleaning fees).
*   **Checkout Flow:**
    1. Select Dates & Camper.
    2. Choose optional add-ons.
    3. Enter Customer Details & Upload Driver's License/Insurance.
    4. Process Payment/Deposit.
    5. Generate Booking Confirmation.

## 5. Security & PII System (Mandatory Requirement)
*   **Data Encryption:** All Personally Identifiable Information (PII)—including driver's licenses, physical addresses, phone numbers, and payment details—must be encrypted at rest in the database and transmitted via strict HTTPS/TLS protocols.
*   **Access Control:** Role-Based Access Control (RBAC) ensuring only authorized administrative accounts can view decrypted customer PII.
*   **Data Purging:** Automated cron jobs/scripts to purge, hash, or anonymize sensitive identity verification documents a set number of days (e.g., 30 days) after the camper is returned and inspected.

## 6. Technology Stack Architecture
*The backend must be built using a decoupled architecture to allow for rapid UI updates and future inventory expansion.*
*   **Backend Framework:** **Flask (Python)**. Lightweight and highly customizable for building the RESTful API that handles booking logic and inventory management.
*   **WSGI Server:** **Gunicorn**. To serve the Flask application robustly and handle concurrent booking requests securely in production.
*   **Database:** **PostgreSQL**, integrated via SQLAlchemy (Flask-SQLAlchemy) for strict relational data mapping.
*   **Frontend Framework:** **Next.js (React)**, styled with **Tailwind CSS**.
*   **3D Visuals:** **Three.js** (or embedded Spline/Vectary iFrames) for lightweight, browser-native 3D camper rendering.
*   **Mapping:** **Mapbox GL JS** or **Google Maps API** for the Southeastern destination map.

## 7. Data Model Architecture (Blueprint)
*   **`Campers` Table:** `id`, `name`, `class_type`, `sleeps`, `towing_weight_lbs`, `daily_rate`, `image_url`, `is_active`.
*   **`Bookings` Table:** `id`, `camper_id`, `start_date`, `end_date`, `total_price`, `security_deposit`, `status` (pending/confirmed/completed).
*   **`Customers` (PII Secure) Table:** `id`, `first_name`, `last_name`, `encrypted_email`, `encrypted_phone`, `encrypted_license_data`.
