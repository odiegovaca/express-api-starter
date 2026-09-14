import express from "express";
import { z } from "zod/v4";

const EMOJIS = ["😀", "😳", "🙄"];

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

// A mensagem nomeia o parametro recusado: sem isso o cliente recebe "entrada
// invalida" e tem de adivinhar qual dos dois recortes estava errado.
function describeIssue(issue) {
  const campo = issue.path[0];
  if (campo === "limit") {
    return "limit: informe um numero inteiro entre 1 e 100";
  }
  return "offset: informe um numero inteiro maior ou igual a 0";
}

const router = express.Router();

router.get("/", (req, res, next) => {
  const parsed = listQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    res.status(400);
    next(new Error(parsed.error.issues.map(describeIssue).join("; ")));
    return;
  }

  const { limit, offset = 0 } = parsed.data;
  const recorte = limit === undefined
    ? EMOJIS.slice(offset)
    : EMOJIS.slice(offset, offset + limit);

  res.set("X-Total-Count", String(EMOJIS.length));
  res.json(recorte);
});

export default router;
