const multer = require("multer");
const path = require("path");

const upload = multer({
  dest: "uploads/",
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // .docx
    ];
    const allowedExtensions = [".pdf", ".txt", ".doc", ".docx"];

    const mimetypeOk = allowedTypes.includes(file.mimetype);
    const extensionOk = allowedExtensions.includes(path.extname(file.originalname).toLowerCase());

    if (mimetypeOk && extensionOk) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, TXT, DOC, and DOCX files are allowed"), false);
    }
  },
});

module.exports = upload;
