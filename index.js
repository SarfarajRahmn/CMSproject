require("dotenv").config();

const express = require("express");
const path = require("path");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const contentService = require("./content-service");

const app = express();
const PORT = process.env.PORT || 8080;

// Configure Cloudinary with environment variables (with fallback defaults)
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "dpy8pnzaq";
const apiKey = process.env.CLOUDINARY_API_KEY || "317115569113495";
const apiSecret = process.env.CLOUDINARY_API_SECRET || "qfJW8rOkDLsoOxJH7Gn74XQRpYk";

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

// Configure Multer for in-memory file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Middleware for parsing requests and serving static assets
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Singleton initialization for serverless / Vercel compatibility
let initPromise = null;
function ensureInitialized() {
  if (!initPromise) {
    initPromise = contentService
      .initialize()
      .then(() => {
        console.log("Content & Course services initialized successfully.");
      })
      .catch((err) => {
        console.error("Failed to initialize service:", err);
        throw err;
      });
  }
  return initPromise;
}

// Middleware to ensure data service is ready before handling requests
app.use(async (req, res, next) => {
  try {
    await ensureInitialized();
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * Helper to determine if the client expects a JSON response
 */
function expectsJson(req) {
  return (
    req.query.format === "json" ||
    (req.headers.accept && req.headers.accept.includes("application/json")) ||
    req.path.startsWith("/api")
  );
}

/**
 * Uploads a buffer to Cloudinary and returns the secure URL
 */
function uploadToCloudinary(fileBuffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "image", folder: "cms_assets" },
      (error, result) => {
        if (result && result.secure_url) {
          resolve(result.secure_url);
        } else if (result && result.url) {
          resolve(result.url);
        } else {
          reject(error || new Error("Failed to upload image to Cloudinary"));
        }
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
}

// -----------------------------------------------------------------------------
// Core Routes
// -----------------------------------------------------------------------------

// Home Route
app.get("/", async (req, res) => {
  try {
    const [articles, categories, courses] = await Promise.all([
      contentService.getAllArticles().catch(() => []),
      contentService.getCategories().catch(() => []),
      contentService.getAllCourses().catch(() => []),
    ]);
    res.render("home", { articles, categories, courses, page: "home" });
  } catch (err) {
    res.render("home", { articles: [], categories: [], courses: [], page: "home" });
  }
});

// About Route
app.get("/about", (req, res) => {
  res.render("about", { page: "about" });
});

// -----------------------------------------------------------------------------
// Course Management & Sales Routes
// -----------------------------------------------------------------------------

// List All Courses (Catalog)
app.get("/courses", async (req, res) => {
  const { category, search } = req.query;

  try {
    let courses = await (category
      ? contentService.getCoursesByCategory(category)
      : contentService.getAllCourses());

    if (search) {
      const q = search.toLowerCase();
      courses = courses.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.subtitle.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );
    }

    if (expectsJson(req)) {
      return res.json(courses);
    }

    res.render("courses", {
      courses,
      selectedCategory: category || "",
      searchQuery: search || "",
      page: "courses",
    });
  } catch (err) {
    if (expectsJson(req)) {
      return res.status(500).json({ message: "Error loading courses", error: err.message });
    }
    res.render("courses", { courses: [], selectedCategory: "", searchQuery: "", page: "courses" });
  }
});

// Form to Publish a New Course
app.get("/courses/add", (req, res) => {
  res.render("addCourse", { page: "courses" });
});

// Handle Course Creation
app.post(
  "/courses/add",
  upload.single("featureImage"),
  async (req, res) => {
    try {
      let thumbnailUrl = "/images/CONTENT.png";

      if (req.file) {
        try {
          thumbnailUrl = await uploadToCloudinary(req.file.buffer);
        } catch (uploadErr) {
          console.warn("Cloudinary upload failed on course:", uploadErr.message);
        }
      }

      req.body.thumbnail = thumbnailUrl;
      const newCourse = await contentService.addCourse(req.body);

      if (expectsJson(req)) {
        return res.status(201).json(newCourse);
      }
      res.redirect(`/courses/${newCourse.id}`);
    } catch (err) {
      console.error("Error creating course:", err);
      if (expectsJson(req)) {
        res.status(500).json({ message: "Failed to create course", error: err.message });
      } else {
        res.redirect("/courses");
      }
    }
  }
);

// Course Details Page
app.get("/courses/:id", async (req, res) => {
  try {
    const course = await contentService.getCourseById(req.params.id);

    if (expectsJson(req)) {
      return res.json(course);
    }

    res.render("courseDetail", { course, page: "courses" });
  } catch (err) {
    if (expectsJson(req)) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.status(404).render("404", { title: "Course Not Found" });
  }
});

// Form to Edit an Existing Course
app.get("/courses/edit/:id", async (req, res) => {
  try {
    const course = await contentService.getCourseById(req.params.id);
    res.render("editCourse", { course, page: "courses" });
  } catch (err) {
    res.status(404).render("404", { title: "Course Not Found" });
  }
});

// Handle Course Update
app.post(
  "/courses/edit/:id",
  upload.single("featureImage"),
  async (req, res) => {
    const courseId = req.params.id;

    try {
      let thumbnailUrl = req.body.existingThumbnail || "";

      if (req.file) {
        try {
          thumbnailUrl = await uploadToCloudinary(req.file.buffer);
        } catch (uploadErr) {
          console.warn("Cloudinary upload failed on edit course:", uploadErr.message);
        }
      }

      if (thumbnailUrl) {
        req.body.thumbnail = thumbnailUrl;
      }

      await contentService.updateCourse(courseId, req.body);
      res.redirect(`/courses/${courseId}`);
    } catch (err) {
      console.error("Error updating course:", err);
      res.status(500).redirect(`/courses/${courseId}`);
    }
  }
);

// Handle Course Deletion
app.post("/courses/delete/:id", async (req, res) => {
  try {
    await contentService.deleteCourse(req.params.id);
    res.redirect("/courses");
  } catch (err) {
    console.error("Error deleting course:", err);
    res.status(500).redirect("/courses");
  }
});

// Handle Student Enrollment / Checkout
app.post("/courses/enroll", async (req, res) => {
  try {
    const { enrollment, course } = await contentService.enrollStudent(req.body);

    if (expectsJson(req)) {
      return res.status(200).json({ success: true, enrollment, course });
    }

    res.render("enrollmentSuccess", { enrollment, course, page: "courses" });
  } catch (err) {
    console.error("Enrollment failed:", err);
    if (expectsJson(req)) {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(400).redirect("/courses");
  }
});

// -----------------------------------------------------------------------------
// Articles Management Routes
// -----------------------------------------------------------------------------

// Display Add Article Form
app.get("/articles/add", async (req, res) => {
  try {
    const categories = await contentService.getCategories().catch(() => []);
    res.render("addArticle", { categories, page: "articles" });
  } catch (err) {
    res.render("addArticle", { categories: [], page: "articles" });
  }
});

// Handle Adding New Article
app.post(
  "/articles/add",
  upload.single("featureImage"),
  async (req, res) => {
    try {
      let imageUrl = "/images/CONTENT.png";

      if (req.file) {
        try {
          imageUrl = await uploadToCloudinary(req.file.buffer);
        } catch (uploadErr) {
          console.warn("Cloudinary upload failed, using fallback image:", uploadErr.message);
        }
      }

      req.body.featureImage = imageUrl;
      await contentService.addArticle(req.body);

      res.redirect("/articles");
    } catch (error) {
      console.error("Error creating article:", error);
      if (expectsJson(req)) {
        res.status(500).json({ message: "Article creation failed", error: error.message });
      } else {
        res.status(500).render("404", { title: "Error creating article" });
      }
    }
  }
);

// List Articles (supports category filter, minDate filter, and dual JSON/HTML format)
app.get("/articles", async (req, res) => {
  const { category, minDate } = req.query;

  try {
    let articlesPromise;
    if (category) {
      articlesPromise = contentService.getArticlesByCategory(category);
    } else if (minDate) {
      articlesPromise = contentService.getArticlesByMinDate(minDate);
    } else {
      articlesPromise = contentService.getAllArticles();
    }

    const [articles, categories] = await Promise.all([
      articlesPromise.catch(() => []),
      contentService.getCategories().catch(() => []),
    ]);

    if (expectsJson(req)) {
      return res.json(articles);
    }

    res.render("articles", {
      articles,
      categories,
      selectedCategory: category || "",
      page: "articles",
      error: null,
    });
  } catch (err) {
    if (expectsJson(req)) {
      return res.status(500).json({ message: "Error fetching articles", error: err.message });
    }
    res.render("articles", {
      articles: [],
      categories: [],
      selectedCategory: "",
      page: "articles",
      error: "Error retrieving articles.",
    });
  }
});

// Display / Retrieve Single Article by ID
app.get("/articles/:id", async (req, res) => {
  const articleId = req.params.id;

  try {
    const article = await contentService.getArticleById(articleId);

    if (expectsJson(req)) {
      return res.json(article);
    }

    res.render("article", { article, page: "articles" });
  } catch (err) {
    if (expectsJson(req)) {
      return res.status(404).json({ message: "Article not found", error: err.message || err });
    }
    res.status(404).render("article", { article: null, page: "articles" });
  }
});

// Display Edit Article Form
app.get("/articles/edit/:id", async (req, res) => {
  const articleId = req.params.id;

  try {
    const [article, categories] = await Promise.all([
      contentService.getArticleById(articleId),
      contentService.getCategories().catch(() => []),
    ]);
    res.render("editArticle", { article, categories, page: "articles" });
  } catch (err) {
    res.status(404).render("404", { title: "Article not found" });
  }
});

// Handle Updating an Article
app.post(
  "/articles/edit/:id",
  upload.single("featureImage"),
  async (req, res) => {
    const articleId = req.params.id;

    try {
      let imageUrl = req.body.existingImage || "";

      if (req.file) {
        try {
          imageUrl = await uploadToCloudinary(req.file.buffer);
        } catch (uploadErr) {
          console.warn("Cloudinary upload failed on update:", uploadErr.message);
        }
      }

      if (imageUrl) {
        req.body.featureImage = imageUrl;
      }

      await contentService.updateArticle(articleId, req.body);
      res.redirect(`/articles/${articleId}`);
    } catch (err) {
      console.error("Error updating article:", err);
      res.status(500).redirect(`/articles/${articleId}`);
    }
  }
);

// Handle Article Deletion (Supports POST and GET for simple links)
app.post("/articles/delete/:id", async (req, res) => {
  try {
    await contentService.deleteArticle(req.params.id);
    res.redirect("/articles");
  } catch (err) {
    console.error("Error deleting article:", err);
    res.status(500).redirect("/articles");
  }
});

app.get("/articles/delete/:id", async (req, res) => {
  try {
    await contentService.deleteArticle(req.params.id);
    res.redirect("/articles");
  } catch (err) {
    res.status(500).redirect("/articles");
  }
});

// Categories Route (Supports dual JSON and HTML format)
app.get("/categories", async (req, res) => {
  try {
    const categories = await contentService.getCategories();
    if (expectsJson(req)) {
      return res.json(categories);
    }
    res.render("categories", { categories, page: "categories", error: null });
  } catch (err) {
    if (expectsJson(req)) {
      return res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
    res.render("categories", { categories: [], page: "categories", error: "Could not load categories." });
  }
});

// Add New Category
app.post("/categories/add", async (req, res) => {
  try {
    await contentService.addCategory(req.body);
    res.redirect("/categories");
  } catch (err) {
    console.error("Error adding category:", err);
    res.redirect("/categories");
  }
});

// -----------------------------------------------------------------------------
// Dedicated REST API Endpoints
// -----------------------------------------------------------------------------

app.get("/api/courses", async (req, res) => {
  try {
    const courses = await contentService.getAllCourses();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/courses/:id", async (req, res) => {
  try {
    const course = await contentService.getCourseById(req.params.id);
    res.json(course);
  } catch (err) {
    res.status(404).json({ message: "Course not found" });
  }
});

app.post("/api/courses/enroll", async (req, res) => {
  try {
    const result = await contentService.enrollStudent(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get("/api/articles", async (req, res) => {
  const { category, minDate } = req.query;
  try {
    let data;
    if (category) data = await contentService.getArticlesByCategory(category);
    else if (minDate) data = await contentService.getArticlesByMinDate(minDate);
    else data = await contentService.getAllArticles();
    res.json(data);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

app.get("/api/articles/published", async (req, res) => {
  try {
    const articles = await contentService.getPublishedArticles();
    res.json(articles);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

app.get("/api/articles/:id", async (req, res) => {
  try {
    const article = await contentService.getArticleById(req.params.id);
    res.json(article);
  } catch (err) {
    res.status(404).json({ message: err.message || "Article not found" });
  }
});

app.get("/api/categories", async (req, res) => {
  try {
    const categories = await contentService.getCategories();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 404 Route Handler for unmatched paths
app.use((req, res) => {
  if (expectsJson(req)) {
    res.status(404).json({ message: "404 Not Found" });
  } else {
    res.status(404).render("404", { title: "404 Not Found" });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  if (expectsJson(req)) {
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  } else {
    res.status(500).render("404", { title: "500 - Server Error" });
  }
});

// Only start the HTTP listener when NOT running in a Vercel serverless environment
if (!process.env.VERCEL && process.env.NODE_ENV !== "test") {
  ensureInitialized().then(() => {
    app.listen(PORT, () => {
      console.log(`Express HTTP server listening on port ${PORT} (http://localhost:${PORT})`);
    });
  });
}

// Export app for serverless platforms like Vercel
module.exports = app;
