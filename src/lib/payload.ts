import { Action, Row } from "./changesheet.ts";

/**
 * Returns a `/queries:run` payload equivalent to the specified row.
 *
 * Throws an error when it is not possible to generate such a payload, given that
 * the `/queries:run` API endpoint only supports a limited range of commands.
 *
 * References:
 * - https://microbiomedata.github.io/nmdc-runtime/howto-guides/author-changesheets/
 * - https://api.microbiomedata.org/docs#/queries/run_query_queries_run_post
 */
export const makePayload = (row: Row): object => {
  switch (row.action) {
    // Note: We leverage JavaScript's "fall through" behavior to achieve a logical "OR" effect.
    case Action.INSERT:
    case Action.INSERT_ITEM:
    case Action.INSERT_ITEMS: {
      // FIXME: The "Authoring Changesheets" document says the item will only be added to the list if
      //        the list doesn't already contain the same item. Can that sort of _conditional_ adding
      //        be done via `/queries:run`?
      //
      // Reference: https://www.mongodb.com/docs/manual/reference/operator/update/push
      return {
        update: "TODO_set", // FIXME: Determine real collection name (may need to access API, or check schema).
        updates: [
          { q: { id: row.id }, u: { $push: { [row.attribute]: row.value } } },
        ],
      };
    }
    case Action.UPDATE:
    case Action.SET:
    case Action.REPLACE:
    case Action.REPLACE_ITEMS: {
      // Reference: https://www.mongodb.com/docs/manual/reference/operator/update/set
      return {
        update: "TODO_set", // FIXME: Determine real collection name (may need to access API, or check schema).
        updates: [
          { q: { id: row.id }, u: { $set: { [row.attribute]: row.value } } },
        ],
      };
    }
    case Action.REMOVE: {
      // Reference: https://www.mongodb.com/docs/manual/reference/operator/update/unset
      return {
        update: "TODO_set", // FIXME: Determine real collection name (may need to access API, or check schema).
        updates: [{ q: { id: row.id }, u: { $unset: row.attribute } }],
      };
    }
    default: {
      throw Error("Failed to generate equivalent payload.");
    }
  }
};

export const makePayloads = (rows: Row[]): string => {
  const payloads = rows.map((row) => makePayload(row));
  return JSON.stringify(payloads, null, 2);
};
