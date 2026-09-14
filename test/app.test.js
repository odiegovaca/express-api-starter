import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../src/app.js";

describe("app", () => {
  it("responds with a not found message", () =>
    request(app)
      .get("/what-is-this-even")
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(404));

  it("no longer serves the root endpoint", () =>
    request(app)
      .get("/")
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(404));

  // Regressao: com NODE_ENV ausente o app tem de se comportar como producao.
  // Ja vazou caminho absoluto e versao de dependencia em todo 404 daqui.
  it.each(["/", "/what-is-this-even"])("does not leak a stack trace on %s", async (rota) => {
    const res = await request(app).get(rota).expect(404);
    expect(JSON.stringify(res.body)).not.toContain("node_modules");
    expect(res.body.stack).toBe("🥞");
  });
});
