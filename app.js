const express = require("express");
const cors = require('cors'); 
const fs = require("fs");
const pdf = require("pdf-parse");
const mammoth = require("mammoth");
const upload = require("./middleware/uploadMiddleware");
const resumeParser = require("./services/resumeParser");

const app = express();
const port = 3000;

app.use(cors()); 
app.use(express.json());
app.options('*', cors()); 

// Lightweight health endpoint so mobile devices can verify connectivity
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post("/upload", upload.single("resume"), (req, res) => {
  const dataBuffer = fs.readFileSync(req.file.path);
  // if it's pdf file then parse it using pdf-parse
  if (req.file.mimetype === "application/pdf") {
    pdf(dataBuffer)
      .then((data) => {
        console.log(data.text);
        const parsedData = resumeParser(data.text);
        console.log("Parsed Data:", JSON.stringify(parsedData, null, 2));
        res.send(parsedData);
      })
      .catch((err) => {
        console.error("Error parsing PDF:", err);
        res.status(500).send("Failed to parse resume.");
      });
  } else if (req.file.mimetype === "application/msword" || req.file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    mammoth
      .extractRawText({ buffer: dataBuffer })
      .then((result) => {
        console.log(result.value);
        const parsedData = resumeParser(result.value);
        console.log("Parsed Data:", JSON.stringify(parsedData, null, 2));
        res.send(parsedData);
      })
      .catch((err) => {
        console.error("Error parsing DOC:", err);
        res.status(500).send("Failed to parse resume.");
      });
  } else {
    console.warn("Unsupported mimetype:", req.file.mimetype);
    res.status(400).send("Unsupported file type.");
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${port} (reachable from LAN as http://<your-ip>:${port})`);
});
