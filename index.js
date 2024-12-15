import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import User from "./models/userModel.js";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(
      __dirname,
      "../client/public/uploads/users_photos/"
    );
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb("Error: Images Only!");
    }
  },
});

app.get("/api/users", async (req, res) => {
  const users = await User.find({}).sort({ createdAt: -1 });
  if (!users) {
    return res.status(404).json({ error: "No users found" });
  }
  res.status(200).json(users);
});

app.post("/api/add_user", upload.single("photo"), async (req, res) => {
  // console.log(req.body);
  // console.log(req.file);
  const { firstname, lastname, email, password } = req.body;
  const photo = req.file.filename;
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const user = await User.create({
    photo,
    firstname,
    lastname,
    email,
    password: hashedPassword,
  });
  if (!user) {
    return res.status(400).json({ error: "Failed to add user" });
  }
  res.status(200).json(user);
});

// In api/index.js, modify the PATCH endpoint:

app.patch("/api/update_user/:id", upload.single("photo"), async (req, res) => {
  const { id } = req.params;
  const { firstname, lastname, email, password } = req.body;

  // Create an update object with only the basic fields
  let updateData = {
    firstname,
    lastname,
    email,
  };

  // Only add password to update if it was provided
  if (password) {
    updateData.password = password;
  }

  // Only add photo to update if a new file was uploaded
  if (req.file) {
    updateData.photo = req.file.filename;
  }

  try {
    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true } // This option returns the updated document
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(
        `--Database connected successfully\n--Server is running on port ${PORT}`
      );
    });
  })
  .catch((err) => {
    console.log(err);
  });
