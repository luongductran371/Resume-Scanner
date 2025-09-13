const multer = require("multer");
const path = require("path");

const upload = multer({
  dest: "uploads/",
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["application/pdf", "text/plain", "application/msword"];
    const allowedExtensions = [".pdf", ".txt", ".doc"];

    const mimetypeOk = allowedTypes.includes(file.mimetype);
    const extensionOk = allowedExtensions.includes(path.extname(file.originalname).toLowerCase());

    if (mimetypeOk && extensionOk) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, TXT, and DOC files are allowed"), false);
    }
  },
});

module.exports = upload;
