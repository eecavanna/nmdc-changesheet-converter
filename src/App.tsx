import { useState } from "react";
import DataGrid from "react-data-grid";
import CodeMirror, { highlightWhitespace } from "@uiw/react-codemirror";
import { langs } from "@uiw/codemirror-extensions-langs";
import { codeMirrorExtensions } from "./lib/codemirror.ts";
import {
  Action,
  parseChangesheetContent,
  populateMissingActions,
  populateMissingIds,
  Row as CSRow,
} from "./lib/changesheet.ts";
import "react-data-grid/lib/styles.css";
import { Col, Container, Row } from "react-bootstrap";

// Note: This string was copy/pasted from: `src/lib/test-data/vendor/changesheet-without-separator1.tsv`
const changesheetContent = `
id	action	attribute	value
gold:Gs0103573	update	name	NEW NAME 1
		ecosystem	SOIL
gold:Gs0114663	update	doi	v1
v1		has_raw_value	10.9999/8888
	update	name	NEW NAME 2
	update	principal_investigator	v2
v2		has_raw_value	NEW RAW VALUE 2
`.trim();

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
const makePayload = (row: CSRow): object => {
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

const makePayloads = (rows: CSRow[]): string => {
  const payloads = rows.map((row) => makePayload(row));
  return JSON.stringify(payloads, null, 2);
};

function App() {
  const [editorValue, setEditorValue] = useState<string>(changesheetContent);
  const result = parseChangesheetContent(editorValue);

  // Get column names from result metadata.
  const columns = Array.isArray(result.meta.fields)
    ? result.meta.fields.map((name) => ({ key: name, name }))
    : [];

  // Get the row content from the result data.
  const rows = result.data;

  // Get a version where all `action` and `id` values are explicit.
  // Reference: https://developer.mozilla.org/en-US/docs/Web/API/structuredClone
  let failedToInferStuff = false;
  let rowsExplicit: CSRow[] = [];
  try {
    rowsExplicit = populateMissingActions(
      populateMissingIds(window.structuredClone(rows)),
    );
  } catch (error) {
    console.warn(error);
    failedToInferStuff = true;
  }

  // Make a list of `/queries:run` API endpoint payloads.
  let payloads = "";
  try {
    payloads = makePayloads(rowsExplicit);
  } catch (error) {
    console.warn(error);
  }

  return (
    <Container fluid>
      <Row className={"pb-3"}>
        <Col>
          <h3>Changesheet</h3>
          <small>
            <span>Source: </span>
            <a
              target={"_blank"}
              rel={"noreferrer"}
              href={
                "https://github.com/microbiomedata/nmdc-runtime/blob/84bb7dec50bbc74682c04f466d317eaa07102ebf/metadata-translation/notebooks/data/changesheet-without-separator1.tsv"
              }
              style={{ textDecoration: "none" }}
            >
              changesheet-without-separator1.tsv
            </a>
          </small>
          <CodeMirror
            theme={"dark"}
            // TODO: Consider implementing a CodeMirror language extension for CSV/TSV files.
            //       See: https://gist.github.com/rooks/6a13affb544ef8bc338b49af7d018318
            extensions={[highlightWhitespace(), codeMirrorExtensions.tab()]}
            onChange={setEditorValue}
            value={editorValue}
            indentWithTab={false} // turn this off and use the extension instead
          />
        </Col>
      </Row>
      <Row className={"pb-3"}>
        <Col>
          <h3>Changesheet as table</h3>
          <DataGrid columns={columns} rows={rows} />
        </Col>
      </Row>
      <Row
        className={"pb-3"}
        style={failedToInferStuff ? { filter: "blur(8px)" } : {}}
      >
        <Col>
          <h3>
            Changesheet as table (showing inferred <code>id</code> and{" "}
            <code>action</code> values)
          </h3>
          <DataGrid columns={columns} rows={rowsExplicit} />
        </Col>
      </Row>
      <Row style={failedToInferStuff ? { filter: "blur(8px)" } : {}}>
        <Col>
          <h3>
            Equivalent payloads for <code>/queries:run</code> API endpoint
          </h3>
          <CodeMirror
            editable={false}
            theme={"dark"}
            extensions={[langs.json()]}
            value={payloads}
          />
        </Col>
      </Row>
    </Container>
  );
}

export default App;
