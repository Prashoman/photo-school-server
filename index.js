const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

//verify jwt
const verifyJWT = (req, res, next) => {
  //console.log(req.headers);
  const authorization = req.headers.authorization;
  //console.log(authorization);
  if (!authorization) {
    return res.status(401).send({ error: true, message: "UnAuthorized User" });
  }
  const token = authorization.split(" ")[1];
  if (!token) {
    return res.status(401).send({ error: true, message: "UnAuthorized User" });
  }
  jwt.verify(token, process.env.JWT_TOKEN_SECRET, (error, decoded) => {
    if (error) {
      return res
        .status(401)
        .send({ error: true, message: "UnAuthorized User" });
    }
    req.decoded = decoded;
    next();
  });
};
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.5onzxss.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollection = client.db("photographyDB").collection("users");
    // const verifyAdmin = async (req, res, next) => {
    //   const email = req.decoded.email;
    //   //console.log("verify", email);
    //   const query = { email: email };
    //   const user = await usersCollection.findOne(query);
    //   //console.log("user", user);
    //   if (user?.role !== "admin") {
    //     return res
    //       .status(403)
    //       .send({ error: true, message: "forbidden message" });
    //   }
    //   next();
    // };
    ///admin middelware
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user?.role !== "admin") {
        return res
          .status(403)
          .send({ error: true, message: "forbidden message" });
      }
      next();
    };

    //instructor
    const verifyInstructor = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user?.role !== "instructor") {
        return res
          .status(403)
          .send({ error: true, message: "forbidden message" });
      }
    };

    //jwt
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const jwtToken = jwt.sign(user, process.env.JWT_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ jwtToken });
    });

    //users
    app.post("/users", async (req, res) => {
      const { userInfo } = req.body;

      //console.log(userInfo);
      const query = { email: userInfo.email };
      const existingEmail = await userCollection.findOne(query);
      if (existingEmail) {
        return res.send({ message: "user already exists" });
      }

      const result = await userCollection.insertOne(userInfo);
      res.send(result);
    });

    app.get("/users", verifyJWT, verifyAdmin, async (req, res) => {
      //const query = { $sort: { created_at: 1 } };
      const result = await userCollection
        .find()
        .sort({ created_at: -1 })
        .toArray();
      res.send(result);
    });

    app.delete("/user/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    //create an instructor
    app.patch("/user/instructor/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const upDoc = {
        $set: {
          role: "instructor",
        },
      };
      const result = await userCollection.updateOne(filter, upDoc, options);
      res.send(result);
    });

    //create an admin
    app.patch("/user/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      //console.log(filter);
      const options = { upsert: true };
      const upDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await userCollection.updateOne(filter, upDoc, options);
      res.send(result);
    });

    app.get("/user/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      // console.log("email", email);
      if (email !== req.decoded.email) {
        return res.status(403).send({ error: true, message: "forbidden user" });
      }
      console.log("role", email);
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const admin = { admin: user?.role === "admin" };
      const student = { student: user?.role === "student" };
      const instructor = { instructor: user?.role === "instructor" };
      res.send({ admin, student, instructor });
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("The Photography is clicking Photo");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
