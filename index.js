const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
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

    //jwt
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const jwtToken = jwt.sign(user, process.env.JWT_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ jwtToken });
    });

    app.post("/users", async (req, res) => {
      const { userInfo } = req.body;

      console.log(userInfo);
      const query = { user: userInfo.user };
      const existinguser = await userCollection.findOne(query);
      if (existinguser) {
        return res.send({ message: "user already exists" });
      }

      const result = await userCollection.insertOne(userInfo);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      //const query = { $sort: { created_at: 1 } };
      const result = await userCollection
        .find()
        .sort({ created_at: -1 })
        .toArray();
      res.send(result);
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
