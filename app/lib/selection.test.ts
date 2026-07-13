import { describe, expect, it } from "vitest";
import { DEFAULT_SELECTION } from "./questions";
import { laneLabel, parseSelection, selectionToSearch } from "./selection";

describe("parseSelection", () => {
  it("falls back to everything when params are missing", () => {
    expect(parseSelection(new URLSearchParams())).toEqual(DEFAULT_SELECTION);
  });

  it("parses lanes and types, dropping invalid entries", () => {
    const sel = parseSelection(
      new URLSearchParams("lanes=TOP,BOGUS,MIDDLE&types=title,nope,item-price"),
    );
    expect(sel.lanes).toEqual(["TOP", "MIDDLE"]);
    expect(sel.types).toEqual(["title", "item-price"]);
  });

  it("falls back to everything when params are entirely invalid", () => {
    const sel = parseSelection(new URLSearchParams("lanes=BOGUS&types=nope"));
    expect(sel).toEqual(DEFAULT_SELECTION);
  });
});

describe("selectionToSearch", () => {
  it("omits params when everything is selected", () => {
    expect(selectionToSearch(DEFAULT_SELECTION)).toBe("");
  });

  it("encodes subsets in canonical order", () => {
    const search = selectionToSearch({
      lanes: ["MIDDLE", "TOP"],
      types: ["item-price", "title"],
    });
    expect(search).toBe("?lanes=TOP%2CMIDDLE&types=title%2Citem-price");
  });

  it("round-trips through parseSelection", () => {
    const selection = {
      lanes: ["TOP", "UTILITY"],
      types: ["skill", "rune-style"],
    } as const;
    const search = selectionToSearch({
      lanes: [...selection.lanes],
      types: [...selection.types],
    });
    const parsed = parseSelection(new URLSearchParams(search));
    expect(parsed.lanes).toEqual(["TOP", "UTILITY"]);
    expect(parsed.types).toEqual(["skill", "rune-style"]);
  });
});

describe("laneLabel", () => {
  it("joins subset labels in lane order", () => {
    expect(laneLabel(["MIDDLE", "TOP"])).toBe("TOP・MID");
  });

  it("is empty when all or no lanes are selected", () => {
    expect(laneLabel(["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"])).toBe(
      "",
    );
    expect(laneLabel([])).toBe("");
  });
});
