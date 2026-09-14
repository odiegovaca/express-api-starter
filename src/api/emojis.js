import express from "express";
import { z } from "zod/v4";

const EMOJIS = ["😀", "😳", "🙄"];

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

// Indexado pelo campo: o schema pode ganhar um terceiro parametro sem que a
// mensagem de outro passe a responder por ele.
const MENSAGENS = {
  limit: "limit: informe um numero inteiro entre 1 e 100",
  offset: "offset: informe um numero inteiro maior ou igual a 0",
};

function describeIssue(issue) {
  const campo = issue.path[0];
  return MENSAGENS[campo] ?? `${campo}: valor invalido`;
}

const router = express.Router();

router.get("/", (req, res) => {
  // Antes da validacao: o Requisito 4 pede o total em toda resposta da listagem,
  // e o ramo de erro sai daqui sem passar pelo fim da funcao.
  res.set("X-Total-Count", String(EMOJIS.length));

  const parsed = listQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    // Responde direto em vez de passar pelo errorHandler: la a resposta levaria
    // a pilha junto sempre que NODE_ENV nao for "production", e o default e
    // "development" — caminho absoluto e versao de dependencia num 400 publico.
    res.status(400).json({
      message: parsed.error.issues.map(describeIssue).join("; "),
    });
    return;
  }

  const { limit, offset = 0 } = parsed.data;
  const recorte = limit === undefined
    ? EMOJIS.slice(offset)
    : EMOJIS.slice(offset, offset + limit);

  res.json(recorte);
});

export default router;
