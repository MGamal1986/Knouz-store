import { Router } from "express";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) {
      res.status(400).json({ error: "Image data is required" });
      return;
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      res.status(503).json({ error: "Image upload not configured" });
      return;
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "knouz";

    const crypto = await import("crypto");
    const signatureStr = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(signatureStr).digest("hex");

    const formData = new URLSearchParams();
    formData.append("file", data);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("folder", folder);
    formData.append("signature", signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const err = await response.text();
      req.log.error({ err }, "Cloudinary upload failed");
      res.status(500).json({ error: "Upload failed" });
      return;
    }

    const result = (await response.json()) as { secure_url: string; public_id: string };
    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    req.log.error({ err }, "Failed to upload image");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
