const express = require("express");
const app = express();
const port = 3000;  

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.post("/upload", (req, res) => {
  res.send("Uploaded");
});

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});