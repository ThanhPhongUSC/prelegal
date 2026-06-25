import { describe, it, expect } from "vitest";
import {
  defaultNdaData,
  formatConfidentiality,
  formatEffectiveDate,
  formatMndaTerm,
  interpolationValues,
  STANDARD_TERMS,
} from "@/lib/nda";
import { make } from "./helpers";

describe("formatEffectiveDate", () => {
  it("shows a placeholder when no date is set", () => {
    expect(formatEffectiveDate("")).toBe("[Today's date]");
  });

  it("formats an ISO date in a readable, locale-stable form", () => {
    expect(formatEffectiveDate("2026-07-02")).toBe("July 2, 2026");
  });

  it("does not shift the day across timezones", () => {
    // A naive `new Date('2026-01-01')` parses as UTC midnight and can render
    // as Dec 31 in negative-offset zones; the helper must avoid that.
    expect(formatEffectiveDate("2026-01-01")).toBe("January 1, 2026");
  });
});

describe("formatMndaTerm", () => {
  it("describes a fixed duration with singular year", () => {
    expect(formatMndaTerm(make({ mndaTermChoice: "duration", mndaTermYears: 1 }))).toBe(
      "Expires 1 year from the Effective Date.",
    );
  });

  it("pluralizes years correctly", () => {
    expect(formatMndaTerm(make({ mndaTermChoice: "duration", mndaTermYears: 3 }))).toContain(
      "3 years",
    );
  });

  it("describes the open-ended option", () => {
    expect(formatMndaTerm(make({ mndaTermChoice: "openEnded" }))).toBe(
      "Continues until terminated in accordance with the terms of the MNDA.",
    );
  });
});

describe("formatConfidentiality", () => {
  it("describes a fixed duration including the trade-secret carve-out", () => {
    const result = formatConfidentiality(
      make({ confidentialityChoice: "duration", confidentialityYears: 2 }),
    );
    expect(result).toContain("2 years from the Effective Date");
    expect(result).toContain("trade secret");
  });

  it("describes the perpetual option", () => {
    expect(formatConfidentiality(make({ confidentialityChoice: "perpetual" }))).toBe(
      "In perpetuity.",
    );
  });
});

describe("interpolationValues", () => {
  it("returns user-provided values when present", () => {
    const values = interpolationValues(
      make({ governingLaw: "Delaware", jurisdiction: "New Castle County, Delaware" }),
    );
    expect(values).toEqual({
      governingLaw: "Delaware",
      jurisdiction: "New Castle County, Delaware",
    });
  });

  it("falls back to placeholders when empty", () => {
    const values = interpolationValues(make({ governingLaw: "", jurisdiction: "" }));
    expect(values.governingLaw).toBe("[State]");
    expect(values.jurisdiction).toBe("[city or county and state]");
  });
});

describe("STANDARD_TERMS", () => {
  it("contains all 11 sections numbered sequentially", () => {
    expect(STANDARD_TERMS).toHaveLength(11);
    expect(STANDARD_TERMS.map((s) => s.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it("only uses interpolation tokens that interpolationValues provides", () => {
    const provided = new Set(Object.keys(interpolationValues(defaultNdaData)));
    for (const section of STANDARD_TERMS) {
      const tokens = section.body.match(/\{\{([^}]+)\}\}/g) ?? [];
      for (const token of tokens) {
        expect(provided.has(token.slice(2, -2))).toBe(true);
      }
    }
  });

  it("uses defined-term markers for the Cover Page references", () => {
    const section9 = STANDARD_TERMS.find((s) => s.n === 9)!;
    expect(section9.body).toContain("{{governingLaw}}");
    expect(section9.body).toContain("{{jurisdiction}}");
    const section1 = STANDARD_TERMS.find((s) => s.n === 1)!;
    expect(section1.body).toContain("[[Purpose]]");
  });
});

describe("defaultNdaData", () => {
  it("pre-fills a sensible purpose and 1-year terms", () => {
    expect(defaultNdaData.purpose).toMatch(/business relationship/i);
    expect(defaultNdaData.mndaTermYears).toBe(1);
    expect(defaultNdaData.confidentialityYears).toBe(1);
  });

  it("starts with empty, independent party objects", () => {
    expect(defaultNdaData.party1).toEqual({
      printName: "",
      title: "",
      company: "",
      noticeAddress: "",
    });
    expect(defaultNdaData.party1).not.toBe(defaultNdaData.party2);
  });
});
