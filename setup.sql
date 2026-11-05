-- PostgreSQL / Neon DB Schema for CMS Project

-- Drop existing tables if reinitializing
DROP TABLE IF EXISTS articles;
DROP TABLE IF EXISTS categories;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- Articles table
CREATE TABLE IF NOT EXISTS articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(255) NOT NULL DEFAULT 'Sarfaraj Rahman',
    published BOOLEAN NOT NULL DEFAULT true,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    category VARCHAR(100) NOT NULL,
    feature_image TEXT,
    article_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Seed Categories
INSERT INTO categories (id, name, description) VALUES
(1, 'Programming', 'Software development, modern frameworks, JavaScript, Node.js, and best practices.'),
(2, 'AI', 'Artificial intelligence, machine learning, deep learning models, and ethical AI.'),
(3, 'Data', 'Relational and NoSQL databases, SQL optimization, data modeling, and pipelines.'),
(4, 'Technology', 'Cloud computing, DevOps, emerging technology trends, and system infrastructure.')
ON CONFLICT (id) DO NOTHING;

-- Seed Articles
INSERT INTO articles (title, content, author, published, category_id, category, feature_image, article_date) VALUES
(
    'Why I like JavaScript',
    'JavaScript is a critical programming language in the development of modern web applications. It allows developers to create interactive and dynamic content on websites, making the web more engaging for users. From simple animations to handling complex tasks like form validations and asynchronous data fetching, JavaScript is used widely across industries. It’s integrated directly into browsers, making it easy to run without additional software installations. JavaScript frameworks like React, Angular, and Vue have made it indispensable for building powerful user interfaces. Its importance continues to grow as more businesses adopt web-based solutions for their services, with JavaScript playing a key role in both front-end and back-end development (via Node.js).',
    'Sarfaraj Rahman',
    true,
    1,
    'Programming',
    '/images/WEB.png',
    '2024-10-15'
),
(
    'Will AI take our jobs?',
    'Artificial Intelligence (AI) is transforming industries by automating processes, enhancing decision-making, and improving efficiency. In the future, AI is expected to revolutionize fields such as healthcare, finance, transportation, and education. With machine learning, AI systems can analyze vast amounts of data to predict trends, identify patterns, and even make decisions without human intervention. The rise of AI-powered assistants, autonomous vehicles, and smart homes demonstrates how AI is becoming a crucial part of everyday life. The ethical implications of AI, such as job displacement and privacy concerns, are areas of ongoing debate. However, the benefits of AI, including personalized services, improved healthcare diagnostics, and enhanced cybersecurity, position it as a key technology for the future.',
    'Sarfaraj Rahman',
    true,
    2,
    'AI',
    '/images/AI.png',
    '2024-10-20'
),
(
    'Understanding Databases for Modern Tech',
    'Databases are essential for storing and managing data in virtually every digital system. They organize data in a way that makes it easy to retrieve, update, and manage. Databases are used in a wide variety of applications, from e-commerce websites to financial systems, social media platforms, and even personal mobile apps. They help ensure data integrity, security, and efficient access, making them crucial in decision-making processes for businesses. SQL databases, such as MySQL and PostgreSQL, are used for structured data, while NoSQL databases, such as MongoDB, handle unstructured or semi-structured data. As data grows in volume and complexity, understanding databases and their importance in data management is critical for both developers and businesses.',
    'Sarfaraj Rahman',
    true,
    3,
    'Data',
    '/images/CONTENT.png',
    '2024-10-25'
),
(
    'Cloud Computing and Scalable Web Architecture',
    'Cloud computing has revolutionized how developers deploy and manage web applications. By utilizing on-demand compute, managed storage, and serverless architectures, modern web systems can seamlessly scale to accommodate millions of concurrent users. Services such as Vercel, AWS, and Google Cloud have drastically lowered the barrier to deploying robust, globally distributed applications with minimal maintenance overhead.',
    'Sarfaraj Rahman',
    true,
    4,
    'Technology',
    '/images/Ai generated.png',
    '2024-11-01'
);

