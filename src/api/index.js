import express from "express";

import emojis from "./emojis.js";
import health from "./health.js";

const router = express.Router();

router.use("/emojis", emojis);
router.use("/health", health);

export default router;
