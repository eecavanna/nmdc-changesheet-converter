import { useState } from "react";
import DataGrid from "react-data-grid";
import CodeMirror, { highlightWhitespace } from "@uiw/react-codemirror";
import { langs } from "@uiw/codemirror-extensions-langs";
import { codeMirrorExtensions } from "./lib/codemirror.ts";
import {
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

// FIXME: Determine the relevant collection name (may need to check schema or access API).
// Reference: https://api.microbiomedata.org/docs#/queries/run_query_queries_run_post
const makePayload = (row: CSRow): object => {
  return {
    update: "TODO_set",
    updates: [
      { q: { id: row.id }, u: { $set: { [row.attribute]: row.value } } },
    ],
  };
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
  // FIXME: Now that the changesheet content (UI field) is editable, catch exceptions thrown by these functions.
  const rowsExplicit = populateMissingActions(
    populateMissingIds(window.structuredClone(rows)),
  );

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
      <Row className={"pb-3"}>
        <Col>
          <h3>
            Changesheet as table (with explicit <code>id</code> and{" "}
            <code>action</code> values)
          </h3>
          <DataGrid columns={columns} rows={rowsExplicit} />
        </Col>
      </Row>
      <Row>
        <Col>
          <h3>
            (TODO) Equivalent payloads for <code>/queries:run</code> API
            endpoint
          </h3>
          <CodeMirror
            editable={false}
            theme={"dark"}
            extensions={[langs.json()]}
            value={makePayloads(rowsExplicit)}
          />
        </Col>
      </Row>
    </Container>
  );
}

export default App;
