const path = require("path");
const fs = require("fs").promises;

let articles = [];
let categories = [];
let courses = [];
let enrollments = [];
let isDbMode = false;
let pool = null;

// Optional PostgreSQL integration if configured in environment
if (process.env.DATABASE_URL || process.env.PGHOST) {
  try {
    const { Pool } = require("pg");
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      user: process.env.PGUSER,
      host: process.env.PGHOST,
      database: process.env.PGDATABASE,
      password: process.env.PGPASSWORD,
      port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
      ssl: process.env.PGSSL === "false" ? false : { rejectUnauthorized: false },
    });
  } catch (err) {
    console.warn("pg module not installed or DB config unavailable. Using JSON file storage.");
    pool = null;
  }
}

const articlesFilePath = path.join(__dirname, "data", "articles.json");
const categoriesFilePath = path.join(__dirname, "data", "categories.json");
const coursesFilePath = path.join(__dirname, "data", "courses.json");
const enrollmentsFilePath = path.join(__dirname, "data", "enrollments.json");

/**
 * Persists the current in-memory articles array back to articles.json
 */
async function saveArticlesToFile() {
  try {
    await fs.writeFile(articlesFilePath, JSON.stringify(articles, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write to articles.json:", err.message);
  }
}

/**
 * Persists the current in-memory categories array back to categories.json
 */
async function saveCategoriesToFile() {
  try {
    await fs.writeFile(categoriesFilePath, JSON.stringify(categories, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write to categories.json:", err.message);
  }
}

/**
 * Persists courses array back to courses.json
 */
async function saveCoursesToFile() {
  try {
    await fs.writeFile(coursesFilePath, JSON.stringify(courses, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write to courses.json:", err.message);
  }
}

/**
 * Persists enrollments array back to enrollments.json
 */
async function saveEnrollmentsToFile() {
  try {
    await fs.writeFile(enrollmentsFilePath, JSON.stringify(enrollments, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write to enrollments.json:", err.message);
  }
}

/**
 * Helper to ensure an article object has both category and categoryName
 */
function enrichArticle(article) {
  if (!article) return article;
  let catName = article.category || "General";
  let catId = article.categoryId || null;

  if (categories && categories.length > 0) {
    if (catId) {
      const match = categories.find((c) => c.id == catId);
      if (match) catName = match.name;
    } else if (catName) {
      const match = categories.find((c) => c.name.toLowerCase() === catName.toLowerCase());
      if (match) catId = match.id;
    }
  }

  return {
    ...article,
    id: parseInt(article.id, 10) || article.id,
    categoryId: catId,
    category: catName,
    categoryName: catName,
    published: Boolean(
      article.published === true ||
      article.published === "true" ||
      article.published === "on" ||
      article.published === 1
    ),
    articleDate: article.articleDate || new Date().toISOString().split("T")[0],
    featureImage: article.featureImage || "/images/CONTENT.png",
    author: article.author || "Sarfaraj Rahman",
  };
}

module.exports = {
  /**
   * Initializes the content and course services by loading data files or DB pools.
   */
  initialize: async function () {
    if (pool) {
      try {
        const client = await pool.connect();
        client.release();
        isDbMode = true;
        console.log("Database connection initialized successfully (PostgreSQL).");
      } catch (dbErr) {
        console.warn("Could not connect to PostgreSQL. Falling back to JSON data files:", dbErr.message);
        isDbMode = false;
      }
    }

    try {
      const articlesData = await fs.readFile(articlesFilePath, "utf8");
      articles = JSON.parse(articlesData);

      const categoriesData = await fs.readFile(categoriesFilePath, "utf8");
      categories = JSON.parse(categoriesData);

      // Load Courses
      try {
        const coursesData = await fs.readFile(coursesFilePath, "utf8");
        courses = JSON.parse(coursesData);
      } catch (cErr) {
        courses = [];
      }

      // Load Enrollments
      try {
        const enrollmentsData = await fs.readFile(enrollmentsFilePath, "utf8");
        enrollments = JSON.parse(enrollmentsData);
      } catch (eErr) {
        enrollments = [];
      }

      console.log(`Content & Courses service initialized: ${articles.length} articles, ${categories.length} categories, ${courses.length} courses loaded.`);
    } catch (err) {
      throw new Error(`Unable to read data files: ${err.message}. Please verify data directory exists.`);
    }
  },

  /**
   * Helper to enrich an array of articles with category names
   */
  mapCategoryNames: function (articleList) {
    if (!Array.isArray(articleList)) return [];
    return articleList.map(enrichArticle);
  },

  /**
   * Returns all articles
   */
  getAllArticles: function () {
    return new Promise(async (resolve, reject) => {
      if (isDbMode && pool) {
        try {
          const res = await pool.query("SELECT * FROM articles ORDER BY id ASC");
          if (res.rows.length > 0) {
            return resolve(res.rows.map(enrichArticle));
          }
          return reject(new Error("No articles found"));
        } catch (err) {
          return reject(new Error("Database error fetching articles: " + err.message));
        }
      }

      if (articles.length > 0) {
        resolve(articles.map(enrichArticle));
      } else {
        reject(new Error("No articles found"));
      }
    });
  },

  /**
   * Returns all published articles
   */
  getPublishedArticles: function () {
    return new Promise(async (resolve, reject) => {
      if (isDbMode && pool) {
        try {
          const res = await pool.query("SELECT * FROM articles WHERE published = true ORDER BY id DESC");
          if (res.rows.length > 0) {
            return resolve(res.rows.map(enrichArticle));
          }
          return reject(new Error("No published articles found"));
        } catch (err) {
          return reject(new Error("Database error: " + err.message));
        }
      }

      const published = articles
        .filter((a) => a.published === true || a.published === "true" || a.published === "on")
        .map(enrichArticle);

      if (published.length > 0) {
        resolve(published);
      } else {
        reject(new Error("No published articles found"));
      }
    });
  },

  /**
   * Returns all categories
   */
  getCategories: function () {
    return new Promise(async (resolve, reject) => {
      if (isDbMode && pool) {
        try {
          const res = await pool.query("SELECT * FROM categories ORDER BY id ASC");
          if (res.rows.length > 0) return resolve(res.rows);
          return reject(new Error("No categories found"));
        } catch (err) {
          return reject(new Error("Database error: " + err.message));
        }
      }

      if (categories.length > 0) {
        resolve(categories);
      } else {
        reject(new Error("No categories found"));
      }
    });
  },

  /**
   * Fetches a single category by ID
   */
  getCategoryById: function (id) {
    return new Promise(async (resolve, reject) => {
      const catId = parseInt(id, 10);
      if (isDbMode && pool) {
        try {
          const res = await pool.query("SELECT * FROM categories WHERE id = $1", [catId]);
          if (res.rows.length > 0) return resolve(res.rows[0]);
          return reject(new Error("Category not found"));
        } catch (err) {
          return reject(err);
        }
      }

      const found = categories.find((c) => c.id == id);
      if (found) resolve(found);
      else reject(new Error("Category not found"));
    });
  },

  /**
   * Adds a new category
   */
  addCategory: function (categoryData) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!categoryData.name || !categoryData.name.trim()) {
          return reject(new Error("Category name is required"));
        }

        const name = categoryData.name.trim();
        const description = categoryData.description || "";

        if (isDbMode && pool) {
          const res = await pool.query(
            "INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *",
            [name, description]
          );
          return resolve(res.rows[0]);
        }

        const nextId = categories.length > 0 ? Math.max(...categories.map((c) => parseInt(c.id, 10) || 0)) + 1 : 1;
        const newCat = { id: nextId, name, description };
        categories.push(newCat);
        await saveCategoriesToFile();
        resolve(newCat);
      } catch (err) {
        reject(err);
      }
    });
  },

  /**
   * Adds a new article and persists it
   */
  addArticle: function (articleData) {
    return new Promise(async (resolve, reject) => {
      try {
        const published = Boolean(
          articleData.published === true ||
          articleData.published === "true" ||
          articleData.published === "on"
        );

        let categoryId = articleData.categoryId ? parseInt(articleData.categoryId, 10) : null;
        let categoryName = articleData.category || "";

        if (categoryId && !categoryName) {
          const foundCat = categories.find((c) => c.id === categoryId);
          if (foundCat) categoryName = foundCat.name;
        } else if (categoryName && !categoryId) {
          const foundCat = categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
          if (foundCat) categoryId = foundCat.id;
        }

        if (!categoryName) categoryName = "General";

        const articleDate = articleData.articleDate || new Date().toISOString().split("T")[0];
        const author = articleData.author && articleData.author.trim() ? articleData.author.trim() : "Sarfaraj Rahman";
        const featureImage = articleData.featureImage || "/images/CONTENT.png";

        if (isDbMode && pool) {
          const query = `
            INSERT INTO articles (title, content, author, published, category_id, category, feature_image, article_date)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
          `;
          const values = [
            articleData.title,
            articleData.content,
            author,
            published,
            categoryId,
            categoryName,
            featureImage,
            articleDate,
          ];
          const res = await pool.query(query, values);
          return resolve(enrichArticle(res.rows[0]));
        }

        const nextId = articles.length > 0 ? Math.max(...articles.map((a) => parseInt(a.id, 10) || 0)) + 1 : 1;
        const newArticle = {
          id: nextId,
          title: articleData.title || "Untitled Article",
          content: articleData.content || "",
          author: author,
          published: published,
          category: categoryName,
          categoryId: categoryId || 1,
          articleDate: articleDate,
          featureImage: featureImage,
        };

        articles.push(newArticle);
        await saveArticlesToFile();
        resolve(enrichArticle(newArticle));
      } catch (err) {
        reject(new Error("Error adding article: " + err.message));
      }
    });
  },

  /**
   * Updates an existing article by ID
   */
  updateArticle: function (id, articleData) {
    return new Promise(async (resolve, reject) => {
      try {
        const articleId = parseInt(id, 10);
        const published = Boolean(
          articleData.published === true ||
          articleData.published === "true" ||
          articleData.published === "on"
        );

        let categoryId = articleData.categoryId ? parseInt(articleData.categoryId, 10) : null;
        let categoryName = articleData.category || "";

        if (categoryId && !categoryName) {
          const foundCat = categories.find((c) => c.id === categoryId);
          if (foundCat) categoryName = foundCat.name;
        }

        if (isDbMode && pool) {
          const query = `
            UPDATE articles
            SET title = $1, content = $2, author = $3, published = $4, category_id = $5, category = $6,
                feature_image = COALESCE(NULLIF($7, ''), feature_image)
            WHERE id = $8
            RETURNING *;
          `;
          const values = [
            articleData.title,
            articleData.content,
            articleData.author || "Sarfaraj Rahman",
            published,
            categoryId,
            categoryName,
            articleData.featureImage || null,
            articleId,
          ];
          const res = await pool.query(query, values);
          if (res.rows.length > 0) return resolve(enrichArticle(res.rows[0]));
          return reject(new Error("Article not found"));
        }

        const index = articles.findIndex((a) => parseInt(a.id, 10) === articleId);
        if (index === -1) {
          return reject(new Error("Article not found"));
        }

        const existing = articles[index];
        const updated = {
          ...existing,
          title: articleData.title !== undefined ? articleData.title : existing.title,
          content: articleData.content !== undefined ? articleData.content : existing.content,
          author: articleData.author !== undefined ? articleData.author : existing.author,
          published: published,
          category: categoryName || existing.category,
          categoryId: categoryId || existing.categoryId,
          featureImage: articleData.featureImage || existing.featureImage,
        };

        articles[index] = updated;
        await saveArticlesToFile();
        resolve(enrichArticle(updated));
      } catch (err) {
        reject(new Error("Error updating article: " + err.message));
      }
    });
  },

  /**
   * Deletes an article by ID
   */
  deleteArticle: function (id) {
    return new Promise(async (resolve, reject) => {
      try {
        const articleId = parseInt(id, 10);
        if (isDbMode && pool) {
          const res = await pool.query("DELETE FROM articles WHERE id = $1 RETURNING id", [articleId]);
          if (res.rows.length > 0) return resolve({ id: articleId, success: true });
          return reject(new Error("Article not found"));
        }

        const index = articles.findIndex((a) => parseInt(a.id, 10) === articleId);
        if (index === -1) {
          return reject(new Error("Article not found"));
        }

        const removed = articles.splice(index, 1)[0];
        await saveArticlesToFile();
        resolve({ id: articleId, success: true, removed });
      } catch (err) {
        reject(new Error("Error deleting article: " + err.message));
      }
    });
  },

  /**
   * Returns articles matching a category (name or id)
   */
  getArticlesByCategory: function (category) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!category) {
          return this.getAllArticles().then(resolve).catch(reject);
        }

        const queryParam = String(category).trim().toLowerCase();
        const allArticles = await this.getAllArticles();

        const filtered = allArticles.filter((article) => {
          const catNameMatches = article.category && article.category.toLowerCase() === queryParam;
          const catIdMatches = String(article.categoryId) === queryParam;
          return catNameMatches || catIdMatches;
        });

        if (filtered.length > 0) {
          resolve(filtered);
        } else {
          resolve([]);
        }
      } catch (err) {
        reject(new Error("No articles found for category: " + category));
      }
    });
  },

  /**
   * Returns articles with articleDate >= minDate
   */
  getArticlesByMinDate: function (minDateStr) {
    return new Promise(async (resolve, reject) => {
      try {
        const minDate = new Date(minDateStr);
        if (isNaN(minDate.getTime())) {
          return reject(new Error("Invalid minDate format. Please use YYYY-MM-DD."));
        }

        const allArticles = await this.getAllArticles();
        const filtered = allArticles.filter((article) => {
          const articleDate = new Date(article.articleDate);
          return !isNaN(articleDate.getTime()) && articleDate >= minDate;
        });

        if (filtered.length > 0) {
          resolve(filtered);
        } else {
          resolve([]);
        }
      } catch (err) {
        reject(new Error("Error filtering articles by date: " + err.message));
      }
    });
  },

  /**
   * Returns a single article by ID
   */
  getArticleById: function (id) {
    return new Promise(async (resolve, reject) => {
      try {
        const articleId = parseInt(id, 10);
        if (isNaN(articleId)) {
          return reject(new Error("Invalid article ID"));
        }

        if (isDbMode && pool) {
          const res = await pool.query("SELECT * FROM articles WHERE id = $1", [articleId]);
          if (res.rows.length > 0) {
            return resolve(enrichArticle(res.rows[0]));
          }
          return reject(new Error("Article not found"));
        }

        const found = articles.find((a) => parseInt(a.id, 10) === articleId);
        if (found) {
          resolve(enrichArticle(found));
        } else {
          reject(new Error("Article not found"));
        }
      } catch (err) {
        reject(err);
      }
    });
  },

  // ===========================================================================
  // COURSE MANAGEMENT METHODS
  // ===========================================================================

  /**
   * Retrieves all courses (published or filtered)
   */
  getAllCourses: function () {
    return new Promise((resolve) => {
      resolve(courses);
    });
  },

  /**
   * Retrieves a single course by its ID
   */
  getCourseById: function (id) {
    return new Promise((resolve, reject) => {
      const courseId = parseInt(id, 10);
      const course = courses.find((c) => parseInt(c.id, 10) === courseId);
      if (course) {
        resolve(course);
      } else {
        reject(new Error("Course not found"));
      }
    });
  },

  /**
   * Retrieves courses filtered by category
   */
  getCoursesByCategory: function (category) {
    return new Promise((resolve) => {
      if (!category) return resolve(courses);
      const query = category.trim().toLowerCase();
      const filtered = courses.filter((c) => c.category && c.category.toLowerCase().includes(query));
      resolve(filtered);
    });
  },

  /**
   * Adds a new course to the catalog
   */
  addCourse: function (courseData) {
    return new Promise(async (resolve, reject) => {
      try {
        const nextId = courses.length > 0 ? Math.max(...courses.map((c) => parseInt(c.id, 10) || 0)) + 1 : 1;

        let syllabus = [];
        if (Array.isArray(courseData.syllabus)) {
          syllabus = courseData.syllabus;
        } else if (typeof courseData.syllabus === "string") {
          try {
            syllabus = JSON.parse(courseData.syllabus);
          } catch (e) {
            // Split by lines as simple lessons
            syllabus = [
              {
                module: "Course Curriculum",
                lessons: courseData.syllabus.split("\n").filter((l) => l.trim().length > 0),
              },
            ];
          }
        }

        let highlights = [];
        if (Array.isArray(courseData.highlights)) {
          highlights = courseData.highlights;
        } else if (typeof courseData.highlights === "string") {
          highlights = courseData.highlights.split("\n").filter((h) => h.trim().length > 0);
        }

        const newCourse = {
          id: nextId,
          title: courseData.title || "Untitled Course",
          subtitle: courseData.subtitle || "",
          category: courseData.category || "General",
          level: courseData.level || "All Levels",
          price: parseFloat(courseData.price) || 49,
          originalPrice: parseFloat(courseData.originalPrice) || (parseFloat(courseData.price) || 49) * 1.5,
          duration: courseData.duration || "Self-Paced",
          lessonsCount: parseInt(courseData.lessonsCount, 10) || 20,
          rating: 5.0,
          reviewsCount: 1,
          enrolledCount: 0,
          badge: courseData.badge || "New",
          thumbnail: courseData.thumbnail || "/images/CONTENT.png",
          instructor: {
            name: courseData.instructorName || "Sarfaraj Rahman",
            title: courseData.instructorTitle || "Lead Instructor",
            avatar: courseData.instructorAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
          },
          highlights: highlights.length > 0 ? highlights : [
            "Comprehensive hands-on training with project assignments",
            "Direct mentor feedback and code reviews",
            "Certificate of completion upon course finalization"
          ],
          syllabus: syllabus.length > 0 ? syllabus : [
            {
              module: "Module 1: Course Fundamentals",
              lessons: ["Introduction & Architecture Overview", "Development Environment Setup", "First Practical Exercise"]
            }
          ],
          published: Boolean(courseData.published === true || courseData.published === "true" || courseData.published === "on"),
        };

        courses.push(newCourse);
        await saveCoursesToFile();
        resolve(newCourse);
      } catch (err) {
        reject(new Error("Error adding course: " + err.message));
      }
    });
  },

  /**
   * Updates an existing course
   */
  updateCourse: function (id, courseData) {
    return new Promise(async (resolve, reject) => {
      try {
        const courseId = parseInt(id, 10);
        const index = courses.findIndex((c) => parseInt(c.id, 10) === courseId);
        if (index === -1) {
          return reject(new Error("Course not found"));
        }

        const existing = courses[index];
        const updated = {
          ...existing,
          title: courseData.title !== undefined ? courseData.title : existing.title,
          subtitle: courseData.subtitle !== undefined ? courseData.subtitle : existing.subtitle,
          category: courseData.category !== undefined ? courseData.category : existing.category,
          level: courseData.level !== undefined ? courseData.level : existing.level,
          price: courseData.price !== undefined ? parseFloat(courseData.price) : existing.price,
          originalPrice: courseData.originalPrice !== undefined ? parseFloat(courseData.originalPrice) : existing.originalPrice,
          duration: courseData.duration !== undefined ? courseData.duration : existing.duration,
          lessonsCount: courseData.lessonsCount !== undefined ? parseInt(courseData.lessonsCount, 10) : existing.lessonsCount,
          badge: courseData.badge !== undefined ? courseData.badge : existing.badge,
          thumbnail: courseData.thumbnail || existing.thumbnail,
          published: courseData.published !== undefined
            ? Boolean(courseData.published === true || courseData.published === "true" || courseData.published === "on")
            : existing.published,
        };

        courses[index] = updated;
        await saveCoursesToFile();
        resolve(updated);
      } catch (err) {
        reject(new Error("Error updating course: " + err.message));
      }
    });
  },

  /**
   * Deletes a course by ID
   */
  deleteCourse: function (id) {
    return new Promise(async (resolve, reject) => {
      try {
        const courseId = parseInt(id, 10);
        const index = courses.findIndex((c) => parseInt(c.id, 10) === courseId);
        if (index === -1) {
          return reject(new Error("Course not found"));
        }

        const removed = courses.splice(index, 1)[0];
        await saveCoursesToFile();
        resolve({ id: courseId, success: true, removed });
      } catch (err) {
        reject(new Error("Error deleting course: " + err.message));
      }
    });
  },

  /**
   * Processes a student course enrollment
   */
  enrollStudent: function (enrollmentData) {
    return new Promise(async (resolve, reject) => {
      try {
        const courseId = parseInt(enrollmentData.courseId, 10);
        const course = courses.find((c) => parseInt(c.id, 10) === courseId);
        if (!course) {
          return reject(new Error("Course not found for enrollment"));
        }

        const enrollmentId = "ENR-" + (1000 + enrollments.length + 1);
        const newEnrollment = {
          id: enrollmentId,
          courseId: course.id,
          courseTitle: course.title,
          studentName: enrollmentData.studentName || "Student",
          studentEmail: enrollmentData.studentEmail || "student@example.com",
          studentPhone: enrollmentData.studentPhone || "",
          paymentMethod: enrollmentData.paymentMethod || "Credit / Debit Card",
          amountPaid: course.price,
          enrollmentDate: new Date().toISOString().split("T")[0],
          status: "Confirmed",
        };

        enrollments.push(newEnrollment);
        course.enrolledCount = (course.enrolledCount || 0) + 1;

        await Promise.all([saveEnrollmentsToFile(), saveCoursesToFile()]);
        resolve({ enrollment: newEnrollment, course });
      } catch (err) {
        reject(new Error("Enrollment failed: " + err.message));
      }
    });
  },

  /**
   * Returns all recorded enrollments
   */
  getEnrollments: function () {
    return new Promise((resolve) => resolve(enrollments));
  },
};
