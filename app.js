const express = require("express");
const fs = require("fs");
const pdf = require("pdf-parse");
const upload = require("./middleware/uploadMiddleware");
const resumeParser = require("./utils/resumeParser");

const app = express();
const port = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.post("/upload", upload.single("resume"), (req, res) => {
  const dataBuffer = fs.readFileSync(req.file.path);
  pdf(dataBuffer)
    .then((data) => {
      const parsedData = resumeParser(data.text);
      console.log("Parsed Data:", parsedData);
      res.send(parsedData);
    })
    .catch((err) => {
      console.error("Error parsing PDF:", err);
      res.status(500).send("Failed to parse resume.");
    });
});

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
