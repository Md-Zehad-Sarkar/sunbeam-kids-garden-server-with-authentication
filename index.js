const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.DATABASE_URL;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("sunbeam-kids-garden");
    const collection = db.collection("users");
    const productsCollection = db.collection("products");
    const categoriesCollection = db.collection("categories");

    // User Registration
    app.post("/api/v1/register", async (req, res) => {
      const { name, email, password } = req.body;

      // Check if email already exists
      const existingUser = await collection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      await collection.insertOne({ name, email, password: hashedPassword });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    });

    // User Login
    app.post("/api/v1/login", async (req, res) => {
      const { email, password } = req.body;
      console.log(email, password);

      // Find user by email
      const user = await collection.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { email: user.email, name: user.name },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.EXPIRES_IN,
        }
      );

      res.json({
        success: true,
        message: "Login successful",
        token,
      });
    });

    // ==============================================================
    // WRITE YOUR CODE HERE

    //get all products
    app.get("/api/v1/products", async (req, res) => {
      const result = await productsCollection.find().toArray();
      res.status(200).json({
        success: true,
        message: "all products retrieved successful",
        data: result,
      });
    });

    //delete products
    app.delete("/api/v1/products/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const result = await productsCollection.deleteOne({
          _id: new ObjectId(id),
        });
        if (result.deletedCount > 0) {
          res.status(200).json({
            success: true,
            message: "Product deleted successfully",
          });
        } else {
          res.status(404).json({
            success: false,
            message: "Product not found",
          });
        }
      } catch (error) {
        console.error(error);
      }
    });
    //edit products
    app.delete("/api/v1/products/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const result = await productsCollection.deleteOne({
          _id: new ObjectId(id),
        });
        if (result.deletedCount > 0) {
          res.status(200).json({
            success: true,
            message: "Product deleted successfully",
          });
        } else {
          res.status(404).json({
            success: false,
            message: "Product not found",
          });
        }
      } catch (error) {
        console.error(error);
      }
    });

    //get all categories
    app.get("/api/v1/categories", async (req, res) => {
      const result = await categoriesCollection.find().toArray();

      res.status(200).json({
        success: true,
        message: "all categories retrieved successful",
        data: result,
      });
    });

    // ==============================================================

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
