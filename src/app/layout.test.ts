import { describe, expect, it } from "vitest";
import { metadata } from "./layout";

describe("identidade do navegador", () => {
  it("usa Learning Lab como título da aplicação", () => {
    expect(metadata.title).toBe("Learning Lab");
  });
});
