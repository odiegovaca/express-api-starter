import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../src/app.js";

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
  it("responds with a json message", () =>
    request(app)
      .get("/api/v1/emojis")
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200, ["😀", "😳", "🙄"]));

  it("responds with the whole collection when no query is given", () =>
    request(app)
      .get("/api/v1/emojis")
      .expect(200, ["😀", "😳", "🙄"]));

  it("cuts the collection with limit", () =>
    request(app)
      .get("/api/v1/emojis?limit=2")
      .expect(200, ["😀", "😳"]));

  it("skips the first items with offset", () =>
    request(app)
      .get("/api/v1/emojis?offset=1")
      .expect(200, ["😳", "🙄"]));

  it("combines limit and offset", () =>
    request(app)
      .get("/api/v1/emojis?limit=1&offset=1")
      .expect(200, ["😳"]));

  it("responds with an empty list when offset is past the end", () =>
    request(app)
      .get("/api/v1/emojis?offset=99")
      .expect(200, []));

  it.each(["", "?limit=2", "?offset=1", "?limit=1&offset=1", "?offset=99"])(
    "reports the full collection size in X-Total-Count for %s",
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
  ])("rejects %s naming the parameter", async (query, campo) => {
    const res = await request(app)
      .get(`/api/v1/emojis?${query}`)
      .expect("Content-Type", /json/)
      .expect(400);

    expect(res.body.message).toContain(campo);
  });
});
