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
      const { name, email, password, role, image } = req.body;

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
      await collection.insertOne({
        name,
        email,
        role,
        password: hashedPassword,
        image,
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    });

    //create admin api
    app.post("/api/v1/admin-register", async (req, res) => {
      const { name, email, password, role, image } = req.body;

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
      await collection.insertOne({
        name,
        email,
        role,
        password: hashedPassword,
        image,
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    });

    // User Login
    app.post("/api/v1/login", async (req, res) => {
      const { email, password } = req.body;

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
        {
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        },
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

    //add products
    app.post("/api/v1/products", async (req, res) => {
      try {
        const body = req.body;
        const result = await productsCollection.insertOne(body);
        res.status(200).json({
          success: true,
          message: "all products retrieved successful",
          data: result,
        });
      } catch (error) {
        console.error(error);
      }
    });

    //get all products
    app.get("/api/v1/products", async (req, res) => {
      const result = await productsCollection.find().toArray();
      res.status(200).json({
        success: true,
        message: "all products retrieved successful",
        data: result,
      });
    });

    //get single products
    app.get("/api/v1/products/:productId", async (req, res) => {
      const productId = req.params.productId;

      console.log(productId);

      const result = await productsCollection.findOne({
        _id: new ObjectId(productId),
      });
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
    app.patch("/api/v1/products/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      console.log(body);
      try {
        const query = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            data: req.body,
          },
        };
        const result = await productsCollection.updateOne(query, updateDoc);
        if (result.modifiedCount > 0) {
          res.status(200).json({
            success: true,
            message: "Product Updated Successfully",
            data: req.body,
          });
        } else {
          res.status(404).json({
            success: false,
            message: "Product Not Found",
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
        message: "All Categories Retrieved Successful",
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
