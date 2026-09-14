import express from "express";
import { z } from "zod/v4";

const EMOJIS = [
  { char: "😀", name: "sorriso" },
  { char: "😳", name: "ruborizado" },
  { char: "🙄", name: "revirando" },
];

const listQuerySchema = z.object({
  q: z.string().min(1).max(50).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  sort: z.enum(["nome", "-nome"]).optional(),
});

// Indexado pelo campo: o schema pode ganhar um quarto parametro sem que a
// mensagem de outro passe a responder por ele.
const MENSAGENS = {
  q: "q: informe um trecho de nome com 1 a 50 caracteres",
  limit: "limit: informe um numero inteiro entre 1 e 100",
  offset: "offset: informe um numero inteiro maior ou igual a 0",
  sort: "sort: informe nome ou -nome",
};

// RN04: ordem do portugues, ignorando maiusculas e acentos. Comparar pelo
// codigo do caractere jogaria todo nome acentuado para o fim da lista.
const colacao = new Intl.Collator("pt-BR", { sensitivity: "base" });

function describeIssue(issue) {
  const campo = issue.path[0];
  return MENSAGENS[campo] ?? `${campo}: valor invalido`;
}

const router = express.Router();

router.get("/", (req, res) => {
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

  const { q, limit, offset = 0, sort } = parsed.data;

  // RN01: filtrar antes de recortar. Recortar primeiro devolveria paginas de
  // tamanho imprevisivel e esconderia resultado que caiu fora da primeira.
  const filtrados = q === undefined
    ? EMOJIS
    : EMOJIS.filter(emoji => emoji.name.toLowerCase().includes(q.toLowerCase()));

  // RN02: o total e o do resultado do filtro, nao o da colecao crua.
  // RN05: ordenar nao muda quantos itens existem, entao o header sai daqui.
  res.set("X-Total-Count", String(filtrados.length));

  // RN03: ordenar entre o filtro e o recorte. Depois do recorte, so a pagina
  // ficaria ordenada, e a segunda traria nomes menores que a primeira.
  const ordenados = sort === undefined
    ? filtrados
    : [...filtrados].sort((a, b) => sort === "-nome"
        ? colacao.compare(b.name, a.name)
        : colacao.compare(a.name, b.name));

  const recorte = limit === undefined
    ? ordenados.slice(offset)
    : ordenados.slice(offset, offset + limit);

  res.json(recorte);
});

export default router;
