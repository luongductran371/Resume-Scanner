const express = require("express");
const cors = require('cors'); 
const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");
const mammoth = require("mammoth");
const upload = require("./middleware/uploadMiddleware");
const resumeParser = require("./services/resumeParser");

const app = express();
const port = 3000;

app.use(cors()); 
app.use(express.json());
app.options('*', cors()); 

// Ensure uploads directory exists (multer writes here)
try {
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Created uploads directory at: ${uploadDir}`);
  }
} catch (e) {
  console.error('Failed to ensure uploads directory exists:', e);
}

// Lightweight health endpoint so mobile devices can verify connectivity
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post("/upload", upload.single("resume"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded; expected field name 'resume'.");
    }
    console.log('Incoming upload:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
    });

    const dataBuffer = fs.readFileSync(req.file.path);

    if (req.file.mimetype === "application/pdf") {
      try {
        const data = await pdf(dataBuffer);
        const parsedData = resumeParser(data.text || "");
        console.log("Parsed Data:", JSON.stringify(parsedData, null, 2));
        return res.send(parsedData);
      } catch (err) {
        console.error("Error parsing PDF:", err);
        return res.status(500).json({ error: "Failed to parse PDF resume", details: String(err.message || err) });
      } finally {
        fs.unlink(req.file.path, () => {});
      }
    }

    if (
      req.file.mimetype === "application/msword" ||
      req.file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      try {
        const result = await mammoth.extractRawText({ buffer: dataBuffer });
        const text = (result && result.value) ? result.value : "";
        const parsedData = resumeParser(text);
        console.log("Parsed Data:", JSON.stringify(parsedData, null, 2));
        return res.send(parsedData);
      } catch (err) {
        console.error("Error parsing DOC/DOCX:", err);
        return res.status(500).json({ error: "Failed to parse DOC/DOCX resume", details: String(err.message || err) });
      } finally {
        fs.unlink(req.file.path, () => {});
      }
    }

    console.warn("Unsupported mimetype:", req.file.mimetype);
    return res.status(415).json({ error: "Unsupported file type", mimetype: req.file.mimetype });
  } catch (err) {
    return next(err);
  }
});

// Global error handler (handles multer fileFilter errors, etc.)
app.use((err, req, res, next) => {
  if (err) {
    console.error('Upload error:', err);
    return res.status(400).json({ error: err.message || 'Upload error' });
  }
  next();
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${port} (reachable from LAN as http://<your-ip>:${port})`);
});
