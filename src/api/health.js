import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import express from "express";

// RN06: a versao sai do package.json em tempo de carga. Fixar no codigo faria a
// resposta mentir a cada release.
//
// O try nao e zelo excessivo: este modulo e importado pelo grafo que sobe o app,
// entao uma leitura que lanca aqui derruba o processo na subida — justo o
// endpoint que existe para dizer se o servico esta de pe.
let version = "desconhecida";
try {
  ({ version } = JSON.parse(
    readFileSync(fileURLToPath(new URL("../../package.json", import.meta.url)), "utf8"),
  ));
}
catch {
  // Segue com "desconhecida": responder degradado vale mais que nao responder.
}

const router = express.Router();

// RN07: so status e version. Caminho de arquivo, ambiente e versao de
// dependencia ficam de fora — o endpoint e publico e sem autenticacao.
router.get("/", (req, res) => {
  res.json({ status: "ok", version });
});

export default router;
