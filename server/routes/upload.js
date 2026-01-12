const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");

const r2 = require("../r2");
const { PutObjectCommand } = require("@aws-sdk/client-s3");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB (tùy bạn)
    files: 10,
  },
});

// helper: xác định mediaType
function getMediaType(mimetype) {
  if (!mimetype) return "image";
  if (mimetype.startsWith("video/")) return "video";
  return "image";
}

router.post("/", upload.array("files", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ msg: "Không có file upload" });
    }

    const bucket = process.env.R2_BUCKET;
    const publicBase = process.env.R2_PUBLIC_BASE_URL; // vd: https://pub-xxxx.r2.dev
    if (!bucket || !publicBase) {
      return res.status(500).json({ msg: "Thiếu R2_BUCKET hoặc R2_PUBLIC_BASE_URL" });
    }

    const results = await Promise.all(
      req.files.map(async (f) => {
        const ext = path.extname(f.originalname || "");
        const rand = crypto.randomBytes(8).toString("hex");
        const key = `uploads/${Date.now()}-${rand}${ext}`;

        const cmd = new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: f.buffer,
          ContentType: f.mimetype,
        });

        await r2.send(cmd);

        return {
          url: `${publicBase}/${key}`,
          mediaType: getMediaType(f.mimetype),
          key,
        };
      })
    );

    res.json(results);
  } catch (e) {
    console.error("R2 UPLOAD ERROR:", e);
    res.status(500).json({ msg: "Upload thất bại" });
  }
});

module.exports = router;
