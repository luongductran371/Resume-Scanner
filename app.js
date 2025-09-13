const express = require("express");
const app = express();
app.use(express.json());

const fs = require("fs");
const pdf = require("pdf-parse");

const port = 3000;

const multer = require("multer");
const path = require("path");
const upload = multer({
  dest: "uploads/",
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "application/msword",
    ];
    const allowedExtensions = [".pdf", ".txt", ".doc"];

    const mimetypeOk = allowedTypes.includes(file.mimetype);
    const extensionOk = allowedExtensions.includes(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetypeOk && extensionOk) {
      return cb(null, true);
    } else {
      cb(new Error("Only PDF, TXT, and DOC files are allowed"), false);
    }
  },
});

function parsePersonalInfo(lines) {
  const info = {
    name: null,
    location: null,
    phone: null,
    email: null,
    linkedin: null,
  };
  if (lines[0]) {
    info.name = lines[0];
  }
  if (lines[1]) {
    const parts = lines[1].split("|").map((part) => part.trim());
    parts.forEach((part) => {
      if (/^\+?\d{10,}$/.test(part.replace(/[\s\-()]/g, ""))) {
        info.phone = part;
      } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(part)) {
        info.email = part;
      } else if (/linkedin\.com\/[A-Za-z0-9_-]+/.test(part)) {
        info.linkedin = part;
      } else {
        info.location = part;
      }
    });
  }

  return info;
}

function parseSection(lines) {
  const title = lines[0];
  const content = lines.slice(1);
  return { title, content };
}

function resumeParser(data) {
  
  const resultData = {
    name: null,
    location: null,
    phone: null,
    email: null,
    linkedin: null,
    sections: {},
  };
  const blocks = data.split(/\n\s*\n/);

  // clean the blocks until the first section that has a title
  while (blocks.length) {
    const firstLine = blocks[0].split("\n")[0].trim();
    if (firstLine && /^[A-Z][A-Za-z\s]+$/.test(firstLine)) {
      break;
    }
    blocks.shift();
  }

  blocks.forEach((section, i) => {
    const lines = section
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (i === 0) {
      const personalInfo = parsePersonalInfo(lines);
      Object.assign(resultData, personalInfo);
      } else {
      const parsedSection = parseSection(lines);
      resultData.sections[parsedSection.title] = parsedSection.content; 
      }
    
  });

  return resultData;
}

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.post("/upload", upload.single("resume"), (req, res) => {
  let dataBuffer = fs.readFileSync(req.file.path);
  pdf(dataBuffer)
    .then(function (data) {
      let parsedData = resumeParser(data.text);

      res.send("Success, Resume uploaded and parsed!");

      console.log("Parsed Data:", parsedData);
    })
    .catch((err) => {
      console.error("Error parsing PDF:", err);
    });
});

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
