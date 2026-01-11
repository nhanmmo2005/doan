const express = require("express");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const { PutObjectCommand } = require("@aws-sdk/client-s3");

const r2 = require("../r2");
const auth = require("../middleware/auth");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 80 * 1024 * 1024, // 80MB / file (video)
    files: 10, // tối đa 10 file / bài
  },
  fileFilter: (req, file, cb) => {
    const ok =
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/");
    if (!ok) return cb(new Error("Only image/video allowed"));
    cb(null, true);
  },
});

// POST /api/upload  (multi files)
router.post("/", auth, upload.array("files", 10), async (req, res) => {
  try {
    if (!req.files || !req.files.length) {
      return res.status(400).json({ msg: "No files" });
    }

    const base = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/+$/, "");
    if (!base.startsWith("https://")) {
      return res.status(500).json({ msg: "R2_PUBLIC_BASE_URL invalid" });
    }

    const results = await Promise.all(
      req.files.map(async (f, idx) => {
        const ext = path.extname(f.originalname || "");
        const safeExt =
          ext || (f.mimetype.startsWith("video/") ? ".mp4" : ".png");
        const prefix = f.mimetype.startsWith("video/") ? "videos" : "images";
        const key = `posts/${prefix}/${Date.now()}-${crypto
          .randomBytes(8)
          .toString("hex")}-${idx}${safeExt}`;

        await r2.send(
          new PutObjectCommand({
            Bucket: process.env.R2_BUCKET,
            Key: key,
            Body: f.buffer,
            ContentType: f.mimetype,
          })
        );

        return {
          url: `${base}/${key}`,
          mediaType: f.mimetype.startsWith("video/") ? "video" : "image",
          sortOrder: idx,
          mime: f.mimetype,
        };
      })
    );

    res.json({ items: results });
  } catch (e) {
    console.error("R2 UPLOAD ERROR:", e);
    res.status(500).json({ msg: "Upload failed" });
  }
});

module.exports = router;
