import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import express from "express";

// RN06: a versao sai do package.json em tempo de carga. Fixar no codigo faria a
// resposta mentir a cada release.
const { version } = JSON.parse(
  readFileSync(fileURLToPath(new URL("../../package.json", import.meta.url)), "utf8"),
);

const router = express.Router();

// RN07: so status e version. Caminho de arquivo, ambiente e versao de
// dependencia ficam de fora — o endpoint e publico e sem autenticacao.
router.get("/", (req, res) => {
  res.json({ status: "ok", version });
});

export default router;
