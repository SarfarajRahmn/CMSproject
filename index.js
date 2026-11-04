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
      { resource_type: "image", folder: "cms_articles" },
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

// Initialize Content Service before setting up route handlers
contentService
  .initialize()
  .then(() => {
    console.log("Content service initialized successfully.");

    // Home Route
    app.get("/", async (req, res) => {
      try {
        const [articles, categories] = await Promise.all([
          contentService.getAllArticles().catch(() => []),
          contentService.getCategories().catch(() => []),
        ]);
        res.render("home", { articles, categories, page: "home" });
      } catch (err) {
        res.render("home", { articles: [], categories: [], page: "home" });
      }
    });

    // About Route
    app.get("/about", (req, res) => {
      res.render("about", { page: "about" });
    });

    // Display Add Article Form
    app.get("/articles/add", async (req, res) => {
      try {
        const categories = await contentService.getCategories().catch(() => []);
        res.render("addArticle", { categories, page: "addArticle" });
      } catch (err) {
        res.render("addArticle", { categories: [], page: "addArticle" });
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

    // Dedicated REST API Endpoints
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

    // Start server if not running in serverless wrapper
    if (process.env.NODE_ENV !== "test") {
      app.listen(PORT, () => {
        console.log(`Express HTTP server listening on port ${PORT} (http://localhost:${PORT})`);
      });
    }
  })
  .catch((err) => {
    console.error("Failed to initialize content service:", err);
  });

// Export app for serverless platforms like Vercel
module.exports = app;
