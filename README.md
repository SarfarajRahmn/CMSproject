# 📝 Content Management System (CMS) Web Blog

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg?style=flat&logo=node.js)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-4.21-lightgrey.svg?style=flat&logo=express)](https://expressjs.com/)
[![EJS](https://img.shields.io/badge/Templates-EJS-orange.svg?style=flat)](https://ejs.co/)
[![Bootstrap 5](https://img.shields.io/badge/Bootstrap-5.3-purple.svg?style=flat&logo=bootstrap)](https://getbootstrap.com/)
[![Cloudinary](https://img.shields.io/badge/Media-Cloudinary-blue.svg?style=flat&logo=cloudinary)](https://cloudinary.com/)
[![GitHub](https://img.shields.io/badge/GitHub-SarfarajRahmn-black.svg?style=flat&logo=github)](https://github.com/SarfarajRahmn/CMSproject)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A full-featured, responsive **Content Management System (CMS)** web application developed by **Sarfaraj Rahman**. Built with **Node.js**, **Express**, **EJS templates**, and **Bootstrap 5**, this project delivers a publishing platform for creating, editing, categorizing, and managing digital articles with cloud-backed media uploads.

---

## 🌟 Key Features

- **Course E-Commerce & Academy Platform (Bangladesh BDT ৳)**:
  - **Course Catalog**: Filterable catalog of courses with Bangladesh Taka (`৳ BDT`) pricing, reactive discounts, ratings, difficulty levels, and durations.
  - **Reactive Search & Sorting**: Real-time keyword search with instant clear (`×`) and live client-side sorting (price, rating, popularity).
  - **Curriculum & Syllabus Accordion**: Interactive modules and lectures breakdown for each course.
  - **Bangladesh MFS & Card Checkout**: Modal checkout workflow with student contact collection, operator-validated BD phone format (`01[3-9]\d{8}`), payment via **bKash (বিকাশ)**, **Nagad (নগদ)**, **Rocket (রকেট)**, or **Cards**, and printable confirmation receipts.
  - **Live Reactive Admin Preview**: Publish and edit courses with live reactive discount calculators and real-time course card previews.
- **Full Article CRUD Operations**:
  - **Create**: Write and publish rich articles with author attribution, categories, and image upload.
  - **Read**: Interactive catalog with real-time keyword search, category filtering, and toggleable **Card** & **Table** views.
  - **Update**: Edit existing articles in place with pre-filled metadata and media replacement.
  - **Delete**: Safe article removal with modal confirmations.
- **Dynamic EJS Architecture**:
  - Modular view architecture utilizing clean, reusable partials (`header`, `navbar`, `footer`).
  - Active page indicators, accessible navigation, and breadcrumb navigation.
- **Cloudinary Media Upload**:
  - In-memory buffer uploads via **Multer** and **Streamifier**.
  - Direct streaming to Cloudinary CDN for optimized image delivery.
  - Automatic fallback images for seamless offline development.
- **Dynamic Taxonomy & Filtering**:
  - Real-time client-side search across titles and authors.
  - Filter articles dynamically by category or publication date (`minDate`).
  - Dedicated category hub with post counters and quick filters.
- **Dual Format Architecture (Web & REST API)**:
  - Serves interactive HTML web pages for standard browsers.
  - Serves structured JSON responses when requested via `Accept: application/json` or `?format=json`.
  - Dedicated `/api/*` endpoints for easy third-party integration or mobile frontends.
- **Resilient Hybrid Storage**:
  - In-memory cache with automatic persistence to local JSON files (`data/articles.json`, `data/categories.json`).
  - Seamless optional integration with **PostgreSQL** (Neon.tech, Supabase, or local PostgreSQL).
- **Polished Modern UI**:
  - Clean theme built with Bootstrap 5.3, CSS custom properties, and Font Awesome 6 icons.
  - Instant client-side image preview before form submission.
  - Fully responsive across mobile, tablet, and desktop devices.

---

## 🏗️ Project Architecture

```
CMSproject/
├── data/
│   ├── articles.json           # Local articles datastore
│   ├── categories.json         # Local categories datastore
│   ├── courses.json            # Course catalog datastore (BDT pricing)
│   └── enrollments.json        # Student enrollment orders datastore
├── public/
│   ├── css/
│   │   ├── main.css            # Custom modern theme styles
│   │   └── site.css            # Stylesheet alias
│   ├── images/                 # Graphical assets
│   └── favicon.ico             # Application icon
├── views/
│   ├── partials/
│   │   ├── header.ejs          # HTML head, styles & meta tags
│   │   ├── navbar.ejs          # Responsive navigation bar
│   │   └── footer.ejs          # Footer with credits & scripts
│   ├── 404.ejs                 # Custom 404 page
│   ├── about.ejs               # Developer bio & system overview
│   ├── addArticle.ejs          # Article creation form
│   ├── article.ejs             # Single article reading view
│   ├── articles.ejs            # Articles catalog (grid & table views)
│   ├── categories.ejs          # Categories management
│   ├── editArticle.ejs         # Article editing form
│   └── home.ejs                # Hero landing page & featured posts
├── .env.example                # Sample environment variables
├── .gitignore                  # Git ignore rules
├── content-service.js          # Core data access and service layer
├── index.js                    # Express application entrypoint & routing
├── package.json                # Project dependencies and npm scripts
├── setup.sql                   # SQL schema & seed script for PostgreSQL
└── vercel.json                 # Vercel serverless deployment config
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18.x or later recommended)
- **npm** (v9.x or later)
- **Git**

### 2. Clone the Repository
```bash
git clone https://github.com/SarfarajRahmn/CMSproject.git
cd CMSproject
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example .env
```

Configure your credentials in `.env`:
```env
PORT=8080
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```
> *Note: If Cloudinary keys are omitted, the application uses local fallback images without crashing.*

### 5. Run the Application

**Development Mode (auto-reload via nodemon):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

Open your browser and navigate to: **`http://localhost:8080`**

---

## 📡 REST API Reference

| Endpoint | Method | Query Parameters | Description |
| :--- | :--- | :--- | :--- |
| `/api/courses` | `GET` | — | Retrieve all published courses (JSON) |
| `/api/courses/:id` | `GET` | — | Retrieve single course with full curriculum (JSON) |
| `/api/courses/enroll`| `POST` | — | Process student enrollment / order (JSON) |
| `/api/articles` | `GET` | `category`, `minDate` | Retrieve all or filtered articles (JSON) |
| `/api/articles/published` | `GET` | — | Retrieve published articles only (JSON) |
| `/api/articles/:id` | `GET` | — | Retrieve a single article by ID (JSON) |
| `/api/categories` | `GET` | — | Retrieve list of all categories (JSON) |
| `/articles?format=json` | `GET` | `category`, `minDate` | Retrieve articles in JSON format |
| `/categories?format=json` | `GET` | — | Retrieve categories in JSON format |

---

## 🌐 Web Routes

| Route | Method | Description |
| :--- | :--- | :--- |
| `/` | `GET` | Landing page with hero banner, quick stats, featured courses, and articles |
| `/courses` | `GET` | Courses catalog with search, category filter pills, and price tags |
| `/courses/:id` | `GET` | In-depth course page with curriculum, instructor bio, and enroll CTA |
| `/courses/add` | `GET` | Publish new course form with thumbnail upload |
| `/courses/add` | `POST` | Process course creation |
| `/courses/edit/:id` | `GET` | Edit course form |
| `/courses/edit/:id` | `POST` | Process course updates |
| `/courses/delete/:id`| `POST` | Delete course by ID |
| `/courses/enroll` | `POST` | Process course enrollment and render confirmation receipt |
| `/about` | `GET` | Developer profile, technical skills, and system architecture |
| `/articles` | `GET` | Article catalog with search, category filtering, and view toggle |
| `/articles/:id` | `GET` | Dedicated article reading view |
| `/articles/add` | `GET` | Article creation form with image upload |
| `/articles/add` | `POST` | Process article creation and Cloudinary image upload |
| `/articles/edit/:id`| `GET` | Article editing form |
| `/articles/edit/:id`| `POST` | Process article update |
| `/articles/delete/:id` | `POST` / `GET` | Delete an article by ID |
| `/categories` | `GET` | Category catalog and management |
| `/categories/add` | `POST` | Create a new category |

---

## ☁️ Deployment

### Deploying on Vercel
The repository includes a production-ready `vercel.json` configured for serverless deployment:
1. Import this repository into [Vercel](https://vercel.com).
2. Add your environment variables in the Vercel dashboard:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
3. Click **Deploy**.

---

## 👨‍💻 Author & Maintainer

**Sarfaraj Rahman**
- **GitHub**: [@SarfarajRahmn](https://github.com/SarfarajRahmn)
- **Repository**: [https://github.com/SarfarajRahmn/CMSproject](https://github.com/SarfarajRahmn/CMSproject)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) &bull; Feel free to use and adapt it for your own projects.
