const multer = require("multer");
const path = require("path");
const fs = require("fs");

function createUpload(folder, fileFilter) {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadPath = path.join(__dirname, "../uploads", folder);
            fs.mkdirSync(uploadPath, { recursive: true });
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            cb(null, uniqueSuffix + ext);
        }
    });
    return multer({
        storage: storage,
        fileFilter: fileFilter,
        limits: { fileSize: 10 * 1024 * 1024 }
    });
}

const LESSON_TYPES = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

const lessonFilter = (req, file, cb) => {
    if (LESSON_TYPES.includes(file.mimetype)) return cb(null, true);
    const error = new Error("Format non accepté");
    error.code = "INVALID_TYPE";
    cb(error);
};

const upload = createUpload("messages");
upload.lessons = createUpload("lessons", lessonFilter);

module.exports = upload;