const express = require("express");
const fs = require("fs");
const pdf = require("pdf-parse");
const mammoth = require("mammoth");
const upload = require("./middleware/uploadMiddleware");
const resumeParser = require("./services/resumeParser");

const app = express();
const port = 3000;

app.use(express.json());

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
        console.error("Error parsing DOC:", err)});
  }
});

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
