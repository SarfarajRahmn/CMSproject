# 📝 Content Management System (CMS) Web Blog

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg?style=flat&logo=node.js)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-4.21-lightgrey.svg?style=flat&logo=express)](https://expressjs.com/)
[![EJS](https://img.shields.io/badge/Templates-EJS-orange.svg?style=flat)](https://ejs.co/)
[![Bootstrap 5](https://img.shields.io/badge/Bootstrap-5.3-purple.svg?style=flat&logo=bootstrap)](https://getbootstrap.com/)
[![Cloudinary](https://img.shields.io/badge/Media-Cloudinary-blue.svg?style=flat&logo=cloudinary)](https://cloudinary.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

A full-featured, responsive **Content Management System (CMS)** web application engineered with **Node.js**, **Express**, **EJS templates**, and **Bootstrap 5**. Designed for publishing, managing, filtering, and organizing digital articles across customizable categories with cloud-backed media uploads.

---

## 🌟 Key Features

- **Dynamic EJS Templating**: Modular view architecture using reusable partials (`header`, `navbar`, `footer`).
- **Full Article CRUD Operations**:
  - **Create**: Add new articles with rich content, category association, and author info.
  - **Read**: Grid card view and structured table view with real-time search.
  - **Update**: Edit existing articles with pre-filled metadata and image replacement.
  - **Delete**: Remove articles with confirmation modals.
- **Media Upload with Cloudinary**:
  - In-memory file processing using **Multer** and **Streamifier**.
  - Direct buffer streaming to Cloudinary cloud storage CDN.
  - Automatic fallback images for offline development.
- **Dynamic Category Taxonomy**:
  - Filter articles by category or publication date (`minDate`).
  - Dedicated category explorer with article counters.
- **Dual Format Support (Web & REST API)**:
  - Serves interactive HTML web pages for browsers.
  - Returns structured JSON for programmatic consumption and automated testing when requested via `Accept: application/json` or `?format=json`.
- **Hybrid Storage Resilience**:
  - Default JSON file persistence (`data/articles.json`, `data/categories.json`) with auto-save.
  - Seamless optional integration with **PostgreSQL** (Neon.tech / Supabase / local DB).
- **Modern Responsive UI**:
  - Built with Bootstrap 5.3, custom CSS variables, and Font Awesome 6 icons.
  - Interactive search, view toggling (Cards / Table), and instant image upload previews.

---

## 🏗️ Project Architecture

```
CMSproject/
├── data/
│   ├── articles.json           # Local articles datastore
│   └── categories.json         # Local categories datastore
├── public/
│   ├── css/
│   │   ├── main.css            # Custom modern theme styles
│   │   └── site.css            # Alias stylesheet
│   ├── images/                 # Static graphical assets
│   └── favicon.ico             # App icon
├── views/
│   ├── partials/
│   │   ├── header.ejs          # HTML head, styles & meta tags
│   │   ├── navbar.ejs          # Responsive navigation bar
│   │   └── footer.ejs          # Footer and bundle scripts
│   ├── 404.ejs                 # Friendly 404 page
│   ├── about.ejs               # Developer bio & system overview
│   ├── addArticle.ejs          # Article creation form
│   ├── article.ejs             # Single article reading view
│   ├── articles.ejs            # Articles catalog (grid & table)
│   ├── categories.ejs          # Categories management & grid
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

## 🚀 Quick Start Guide

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
Create a `.env` file in the project root:
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

**Development Mode (with auto-reload):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

Visit the app in your browser at: **`http://localhost:8080`**

---

## 📡 REST API Reference

| Endpoint | Method | Query Parameters | Description |
| :--- | :--- | :--- | :--- |
| `/api/articles` | `GET` | `category`, `minDate` | Retrieve all or filtered articles (JSON) |
| `/api/articles/published` | `GET` | — | Retrieve published articles only (JSON) |
| `/api/articles/:id` | `GET` | — | Retrieve single article by ID (JSON) |
| `/api/categories` | `GET` | — | Retrieve list of all categories (JSON) |
| `/articles?format=json` | `GET` | `category`, `minDate` | Retrieve articles in JSON format |
| `/categories?format=json` | `GET` | — | Retrieve categories in JSON format |

---

## 🌐 Web Routes

| Route | Method | Description |
| :--- | :--- | :--- |
| `/` | `GET` | Homepage with hero section, stats, and featured articles |
| `/about` | `GET` | Developer bio, tech stack, and project overview |
| `/articles` | `GET` | Article catalog with search, category filtering, and view toggle |
| `/articles/:id` | `GET` | Detailed article reading view |
| `/articles/add` | `GET` | Add article form with image upload |
| `/articles/add` | `POST` | Process article creation and Cloudinary image upload |
| `/articles/edit/:id`| `GET` | Edit article form |
| `/articles/edit/:id`| `POST` | Process article update |
| `/articles/delete/:id` | `POST` / `GET` | Delete article by ID |
| `/categories` | `GET` | Category catalog and management |
| `/categories/add` | `POST` | Create a new category |

---

## ☁️ Deployment

### Deploy to Vercel
This project includes a pre-configured `vercel.json` for seamless serverless deployment:
1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. Set Environment Variables in Vercel project settings (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).
3. Deploy!

---

## 👤 Academic Information

- **Student Name**: MD ARAFAT KOYES
- **Student Number**: 133682229
- **Student Email**: [makoyes@myseneca.ca](mailto:makoyes@myseneca.ca)
- **Institution**: Seneca College
- **Course**: WEB322 - Web Programming

### Declaration
I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part of this assignment has been copied manually or electronically from any other source (including websites) or distributed to other students.
