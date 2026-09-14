import { readFileSync } from "node:fs";

import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../src/app.js";

const CATALOGO = [
  { char: "😀", name: "sorriso" },
  { char: "😳", name: "ruborizado" },
  { char: "🙄", name: "revirando" },
];

describe("GET /api/v1", () => {
  it("no longer responds: the decorative route was removed", () =>
    request(app)
      .get("/api/v1")
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(404));
});

describe("GET /api/v1/health", () => {
  it("responds ok with the package version", async () => {
    const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    const res = await request(app)
      .get("/api/v1/health")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body).toEqual({ status: "ok", version });
  });

  // RN07: o endpoint e publico. Um caminho absoluto ou o nome de uma dependencia
  // na resposta ja seria vazamento.
  it("leaks neither file path nor dependency name", async () => {
    const res = await request(app).get("/api/v1/health").expect(200);
    const corpo = JSON.stringify(res.body);
    expect(corpo).not.toContain("node_modules");
    expect(corpo).not.toContain("express");
    expect(Object.keys(res.body).sort()).toEqual(["status", "version"]);
  });

  it("ignores a query string instead of rejecting it", () =>
    request(app).get("/api/v1/health?qualquer=coisa").expect(200));
});

describe("GET /api/v1/emojis", () => {
  it("responds with the whole catalogue as objects when no query is given", () =>
    request(app)
      .get("/api/v1/emojis")
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200, CATALOGO));

  it("cuts the collection with limit", () =>
    request(app)
      .get("/api/v1/emojis?limit=2")
      .expect(200, CATALOGO.slice(0, 2)));

  it("skips the first items with offset", () =>
    request(app)
      .get("/api/v1/emojis?offset=1")
      .expect(200, CATALOGO.slice(1)));

  it("combines limit and offset", () =>
    request(app)
      .get("/api/v1/emojis?limit=1&offset=1")
      .expect(200, [CATALOGO[1]]));

  it("responds with an empty list when offset is past the end", () =>
    request(app)
      .get("/api/v1/emojis?offset=99")
      .expect(200, []));

  it("filters by a chunk of the name", () =>
    request(app)
      .get("/api/v1/emojis?q=revir")
      .expect(200, [CATALOGO[2]]));

  it("ignores case when filtering", async () => {
    const maiusculo = await request(app).get("/api/v1/emojis?q=REVIR").expect(200);
    const minusculo = await request(app).get("/api/v1/emojis?q=revir").expect(200);
    expect(maiusculo.body).toEqual(minusculo.body);
  });

  it("responds with an empty list when q matches nothing", () =>
    request(app)
      .get("/api/v1/emojis?q=zzz")
      .expect(200, []));

  it("applies q before limit and counts the filtered total", async () => {
    const res = await request(app).get("/api/v1/emojis?q=or&limit=1").expect(200);
    expect(res.body).toEqual([CATALOGO[0]]);
    expect(res.headers["x-total-count"]).toBe("2");
  });

  it.each(["", "?limit=2", "?offset=1", "?limit=1&offset=1", "?offset=99"])(
    "reports the filtered total in X-Total-Count for %s",
    async (query) => {
      const res = await request(app).get(`/api/v1/emojis${query}`);
      expect(res.headers["x-total-count"]).toBe("3");
    },
  );

  it.each([
    ["limit=0", "limit"],
    ["limit=abc", "limit"],
    ["limit=101", "limit"],
    ["limit=1.5", "limit"],
    ["offset=-1", "offset"],
    ["q=", "q"],
  ])("rejects %s naming the parameter", async (query, campo) => {
    const res = await request(app)
      .get(`/api/v1/emojis?${query}`)
      .expect("Content-Type", /json/)
      .expect(400);

    expect(res.body.message).toContain(campo);
  });
});

describe("GET /api/v1/emojis?sort", () => {
  // Ordem escrita a mao, nao derivada de um comparador: derivar com
  // localeCompare repetiria a regra em vez de prova-la, e com sensitivity
  // diferente da producao.
  const POR_NOME = [
    CATALOGO[2], // revirando
    CATALOGO[1], // ruborizado
    CATALOGO[0], // sorriso
  ];

  it("sorts by name ascending", async () => {
    const res = await request(app).get("/api/v1/emojis?sort=nome").expect(200);
    expect(res.body).toEqual(POR_NOME);
  });

  it("sorts by name descending", async () => {
    const res = await request(app).get("/api/v1/emojis?sort=-nome").expect(200);
    expect(res.body).toEqual([...POR_NOME].reverse());
  });

  it("keeps the catalogue order when sort is absent", async () => {
    const res = await request(app).get("/api/v1/emojis").expect(200);
    expect(res.body).toEqual(CATALOGO);
  });

  // Regressao #4: sort ordenava no lugar e reordenava o catalogo compartilhado.
  // A ordem tem de ser a original mesmo DEPOIS de uma request ordenada.
  it("does not let a sorted request reorder the catalogue", async () => {
    await request(app).get("/api/v1/emojis?sort=nome").expect(200);
    const res = await request(app).get("/api/v1/emojis").expect(200);
    expect(res.body).toEqual(CATALOGO);
  });

  it("sorts before slicing", async () => {
    const res = await request(app).get("/api/v1/emojis?sort=nome&limit=1").expect(200);
    expect(res.body).toEqual([POR_NOME[0]]);
  });

  it("sorts what q let through, and nothing else", async () => {
    const res = await request(app).get("/api/v1/emojis?q=r&sort=nome").expect(200);
    const esperado = CATALOGO
      .filter(e => e.name.includes("r"))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    expect(res.body).toEqual(esperado);
  });

  it("keeps X-Total-Count as the post-filter total when sort is given", async () => {
    const res = await request(app).get("/api/v1/emojis?q=r&sort=-nome").expect(200);
    expect(res.headers["x-total-count"]).toBe("3");
  });

  // RN04: a comparacao ignora caixa e acento, na ordem do portugues. Sem este
  // teste, trocar o Intl.Collator por comparacao de string crua passaria verde.
  it.each([
    [["Zebra", "acido", "ácido", "Banana"], ["acido", "ácido", "Banana", "Zebra"]],
    [["ovo", "Ovo", "avo"], ["avo", "ovo", "Ovo"]],
  ])("orders %j as %j, ignoring case and accent", (entrada, esperado) => {
    const colacao = new Intl.Collator("pt-BR", { sensitivity: "base" });
    expect([...entrada].sort((a, b) => colacao.compare(a, b))).toEqual(esperado);
  });

  it("rejects an unknown sort value naming the parameter", async () => {
    const res = await request(app)
      .get("/api/v1/emojis?sort=char")
      .expect("Content-Type", /json/)
      .expect(400);

    expect(res.body.message).toBe("sort: informe nome ou -nome");
  });
});
