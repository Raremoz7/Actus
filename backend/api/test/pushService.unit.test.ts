import { describe, it, expect } from "vitest";
import { buildBadgeMessages } from "../src/services/pushService.js";

describe("buildBadgeMessages", () => {
  it("monta uma mensagem por token válido com titulo e deep link", () => {
    const msgs = buildBadgeMessages(
      ["ExponentPushToken[aaaaaaaaaaaaaaaaaaaaaa]", "ExponentPushToken[bbbbbbbbbbbbbbbbbbbbbb]"],
      { id: "first_step", name: "Primeiro Passo" },
    );
    expect(msgs).toHaveLength(2);
    expect(msgs[0].title).toContain("Nova Conquista");
    expect(String(msgs[0].body)).toContain("Primeiro Passo");
    expect(msgs[0].data).toEqual({ type: "badge", badge_id: "first_step" });
  });

  it("ignora tokens inválidos", () => {
    const msgs = buildBadgeMessages(["not-a-token"], { id: "x", name: "X" });
    expect(msgs).toHaveLength(0);
  });
});
