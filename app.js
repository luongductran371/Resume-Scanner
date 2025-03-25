const express = require("express");
const app = express();
require("dotenv").config();

app.set("json spaces", 5);

const PORT = process.env.PORT || 3000;
const fileparser = require("./file-parser");

app.get("/", (request, response) => {
  response.send(`
        <h2>File Upload With <code>NodeJs Express</code></h2>
        <form action = "/api/upload" enctype="multipart/form-data" method="post">
            <div>
                Select File: <input type="file" name="file" multiple="multiple" />
            </div>
            <input type="submit" value="Upload"></input>
        </form>
    `);
});

app.post("/api/upload", async (request, response) => {
  await fileparser(request)
    .then((data) => {
      response.status(200).json({ message: "Success", data });
    })
    .catch((error) => {
      response.status(400).json({ message: "An error occured", error });
    });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
