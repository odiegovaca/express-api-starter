import { env } from "./env.js";

export function notFound(req, res, next) {
  res.status(404);
  const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
  next(error);
}

export function errorHandler(err, req, res, _next) {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode);
  res.json({
    message: err.message,
    // Lista de permissao, nao de negacao: so "development" ve a pilha. Com a
    // regra invertida, qualquer NODE_ENV inesperado (test, staging, vazio)
    // caia no ramo que vaza caminho absoluto e versao de dependencia.
    stack: env.NODE_ENV === "development" ? err.stack : "🥞",
  });
}
