/**
 * This file contains functions that can be used to interpret NMDC changesheets.
 */

import { parse } from "papaparse";

enum ActionValue {
  INSERT = "insert",
  INSERT_ITEM = "insert item",
  INSERT_ITEMS = "insert items",
  REMOVE = "remove",
  REMOVE_ITEM = "remove item",
  REMOVE_ITEMS = "remove items",
  UPDATE = "update",
  SET = "set",
  REPLACE = "replace",
  REPLACE_ITEMS = "replace items",
}

export interface Row {
  id: string; // can be empty string
  action: ActionValue | ""; // can be empty string
  attribute: string;
  value: string; // TODO: Support non-string values, too
}

/**
 * Parses the specified changesheet content into an array of objects, where each
 * object represents a row and is keyed by column names. The array of objects
 * is accompanied by an error array and a metadata array.
 *
 * By default, the parser skips empty lines and gets the column names from the
 * first non-empty line.
 *
 * Example input value:
 * ```
 * id,action,attribute,value
 * 1,foo,bar,baz
 * 2,moo,mar,maz
 * ```
 *
 * Example return value:
 * ```
 * {
 *   data: [
 *     { id: "1", action: "foo", attribute: "bar", value: "baz" },
 *     { id: "2", action: "moo", attribute: "mar", value: "maz" },
 *   ],
 *   errors: [...],
 *   meta: {...},
 * }
 * ```
 *
 * See unit tests for more examples.
 *
 * References:
 * - The data structure returned by the `parse` function:
 *   https://www.papaparse.com/docs#results
 *
 * @param changesheetContent
 * @param parserConfigOverrides
 */
export const parseChangesheetContent = (
  changesheetContent: string,
  parserConfigOverrides: Parameters<typeof parse>[1] = {},
) => {
  const PARSER_CONFIG_BASE = { header: true, skipEmptyLines: true };

  // Apply the parser config overrides.
  const parserConfig = { ...PARSER_CONFIG_BASE, ...parserConfigOverrides };

  // Parse the changesheet content.
  return parse<Row>(changesheetContent, parserConfig);
};

/**
 * Populates missing `id` values in the specified rows. Specifically, if the `id` on a given row is empty,
 * this function populates it with the most recently-encountered non-empty `id` value.
 */
export const populateMissingIds = (orderedRows: Row[]): Row[] => {
  let previousId: Row["id"] = "";
  orderedRows.forEach((row) => {
    if (row.id === "") {
      if (previousId !== "") {
        row.id = previousId;
      } else {
        throw new Error(
          "Failed to populate missing `id` because no previous non-empty `id` exists.",
        );
      }
    }
    previousId = row.id;
  });
  return orderedRows;
};

/**
 * Populates missing `action` values in the specified rows. Specifically, if the `action` on a given row is empty,
 * this function populates it with the most recently-encountered non-empty `action` value.
 */
export const populateMissingActions = (orderedRows: Row[]): Row[] => {
  let previousAction: Row["action"] = "";
  orderedRows.forEach((row) => {
    if (row.action === "") {
      if (previousAction !== "") {
        row.action = previousAction;
      } else {
        throw new Error(
          "Failed to populate missing `action` because no previous non-empty `action` exists.",
        );
      }
    }
    previousAction = row.action;
  });
  return orderedRows;
};
