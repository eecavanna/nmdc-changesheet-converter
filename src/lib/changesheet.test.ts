import {
  parseChangesheetContent,
  populateMissingIds,
  populateMissingActions,
} from "./changesheet.ts";
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

  it("parses changesheet content containing dot-delimited attributes", () => {
    const content = loadTestContent(
      "vendor/changesheet-array-item-nested-attributes.tsv",
    );
    const result = parseChangesheetContent(content);
    expect(result.meta.fields).toHaveLength(4);
    expect(result.errors).toHaveLength(0);
    expect(result.data).toHaveLength(5);
  });

  it("parses changesheet content containing blank ids and actions", () => {
    const content = loadTestContent(
      "vendor/changesheet-without-separator1.tsv",
    );
    const result = parseChangesheetContent(content);
    expect(result.meta.fields).toHaveLength(4);
    expect(result.errors).toHaveLength(0);
    expect(result.data).toHaveLength(7);
  });
});

describe("populateMissingIds", () => {
  it("populates missing id values", () => {
    // Get some rows, some of which are missing `id` values.
    const tsv: string = [
      ["id", "action", "attribute", "value"].join("\t"),
      ["1", "update", "a", "b"].join("\t"),
      ["", "update", "a", "b"].join("\t"),
      ["", "update", "a", "b"].join("\t"),
      ["1", "update", "a", "b"].join("\t"),
      ["2", "replace items", "a", "b"].join("\t"),
      ["", "replace items", "a", "b"].join("\t"),
      ["3", "insert", "a", "b"].join("\t"),
    ].join("\n");
    const result = parseChangesheetContent(tsv);
    expect(result.data).toHaveLength(7);
    expect(result.data[0].id).toBe("1");
    expect(result.data[1].id).toBe("");
    expect(result.data[2].id).toBe("");
    expect(result.data[3].id).toBe("1");
    expect(result.data[4].id).toBe("2");
    expect(result.data[5].id).toBe("");
    expect(result.data[6].id).toBe("3");

    // Populate the empty `id` values.
    const rows = populateMissingIds(result.data);
    expect(rows).toHaveLength(7);
    expect(rows[0].id).toBe("1");
    expect(rows[1].id).toBe("1");
    expect(rows[2].id).toBe("1");
    expect(rows[3].id).toBe("1");
    expect(rows[4].id).toBe("2");
    expect(rows[5].id).toBe("2");
    expect(rows[6].id).toBe("3");
  });
});

describe("populateMissingActions", () => {
  it("populates missing action values", () => {
    // Get some rows, some of which are missing `action` values.
    const tsv: string = [
      ["id", "action", "attribute", "value"].join("\t"),
      ["1", "update", "a", "b"].join("\t"),
      ["1", "", "a", "b"].join("\t"),
      ["1", "", "a", "b"].join("\t"),
      ["1", "update", "a", "b"].join("\t"),
      ["1", "replace items", "a", "b"].join("\t"),
      ["1", "", "a", "b"].join("\t"),
      ["1", "insert", "a", "b"].join("\t"),
    ].join("\n");
    const result = parseChangesheetContent(tsv);
    expect(result.data).toHaveLength(7);
    expect(result.data[0].action).toBe("update");
    expect(result.data[1].action).toBe("");
    expect(result.data[2].action).toBe("");
    expect(result.data[3].action).toBe("update");
    expect(result.data[4].action).toBe("replace items");
    expect(result.data[5].action).toBe("");
    expect(result.data[6].action).toBe("insert");

    // Populate the empty `id` values.
    const rows = populateMissingActions(result.data);
    expect(rows).toHaveLength(7);
    expect(rows[0].action).toBe("update");
    expect(rows[1].action).toBe("update");
    expect(rows[2].action).toBe("update");
    expect(rows[3].action).toBe("update");
    expect(rows[4].action).toBe("replace items");
    expect(rows[5].action).toBe("replace items");
    expect(rows[6].action).toBe("insert");
  });
});
