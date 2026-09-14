import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../src/app.js";

const CATALOGO = [
  { char: "😀", name: "sorriso" },
  { char: "😳", name: "ruborizado" },
  { char: "🙄", name: "revirando" },
];

describe("GET /api/v1", () => {
  it("responds with a json message", () =>
    request(app)
      .get("/api/v1")
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200, {
        message: "API - 👋🌎🌍🌏",
      }));
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
