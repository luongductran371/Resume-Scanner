const express = require("express");
const app = express();
app.use(express.json());
const port = 3000;  

const multer = require("multer");
const path = require('path');
const upload = multer({ dest: "uploads/", fileFilter: (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'text/plain', 'application/msword'];
  const allowedExtensions = ['.pdf', '.txt', '.doc'];
  
  const mimetypeOk = allowedTypes.includes(file.mimetype);
  const extensionOk = allowedExtensions.includes(path.extname(file.originalname).toLowerCase());
  
  if (mimetypeOk && extensionOk) {
    return cb(null, true);  
  } else {
    cb(new Error("Only PDF, TXT, and DOC files are allowed"), false);
  }
  }});

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.post("/upload", upload.single('resume'), (req, res) => {
  console.log("Request file:", req.file);
  res.send("Success, Resume uploaded!");
});

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});