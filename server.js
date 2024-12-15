require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const workoutsRoutes = require("./routes/workouts");

const app = express();

//middleware
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

//routes handling
app.use("/api/workouts", workoutsRoutes);

const PORT = process.env.PORT;
mongoose
  .connect(process.env.MONGO_URI) // Connect to MongoDB
  .then(() => {
    // Listening for requests
    app.listen(PORT, () => {
      console.log(
        `-- Successfully connected to MongoDB. \n-- Server is running on port ${PORT}`
      );
    });
  })
  .catch((err) => {
    console.log(err);
  });
