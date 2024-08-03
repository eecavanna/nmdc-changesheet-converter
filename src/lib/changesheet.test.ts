import { parseChangesheetContent } from "./changesheet.ts";
import { describe, it, expect } from "vitest";
import path from "path";
import fs from "fs";

/**
 * References:
 * - https://nodejs.org/api/path.html
 * - https://nodejs.org/api/fs.html#fsreadfilesyncpath-options
 */
const loadTestContent = (testDataFileName: string): string => {
  return fs.readFileSync(path.join(__dirname, "test-data", testDataFileName), {
    encoding: "utf-8",
  });
};

describe("parseChangesheetContent", () => {
  it("parses changesheet content in CSV format (basic)", () => {
    const content = loadTestContent("basic.csv");
    const result = parseChangesheetContent(content);
    expect(result.meta.fields).toHaveLength(4); // 4 columns
    expect(result.meta.fields).toContain("id");
    expect(result.meta.fields).toContain("action");
    expect(result.meta.fields).toContain("attribute");
    expect(result.meta.fields).toContain("value");
    expect(result.meta.delimiter).toBe(",");
    expect(result.errors).toHaveLength(0);
    expect(result.data).toHaveLength(2); // 2 data rows
    expect(result.data[0].id).toBe("1");
    expect(result.data[0].action).toBe("foo");
    expect(result.data[0].attribute).toBe("bar");
    expect(result.data[0].value).toBe("baz");
    expect(result.data[1].id).toBe("2");
    expect(result.data[1].action).toBe("moo");
    expect(result.data[1].attribute).toBe("mar");
    expect(result.data[1].value).toBe("maz");
  });

  it("parses changesheet content in TSV format (basic)", () => {
    const content = loadTestContent("basic.tsv");
    const result = parseChangesheetContent(content);
    expect(result.meta.fields).toHaveLength(4); // 4 columns
    expect(result.meta.fields).toContain("id");
    expect(result.meta.fields).toContain("action");
    expect(result.meta.fields).toContain("attribute");
    expect(result.meta.fields).toContain("value");
    expect(result.meta.delimiter).toBe("\t");
    expect(result.errors).toHaveLength(0);
    expect(result.data).toHaveLength(2); // 2 data rows
    expect(result.data[0].id).toBe("1");
    expect(result.data[0].action).toBe("foo");
    expect(result.data[0].attribute).toBe("bar");
    expect(result.data[0].value).toBe("baz");
    expect(result.data[1].id).toBe("2");
    expect(result.data[1].action).toBe("moo");
    expect(result.data[1].attribute).toBe("mar");
    expect(result.data[1].value).toBe("maz");
  });
});
