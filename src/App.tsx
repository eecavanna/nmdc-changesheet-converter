import DataGrid from "react-data-grid";
import CodeMirror, { highlightWhitespace } from "@uiw/react-codemirror";
import { langs } from "@uiw/codemirror-extensions-langs";
import { parseChangesheetContent, Row as CSRow } from "./lib/changesheet.ts";
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
  const result = parseChangesheetContent(changesheetContent);

  // Get column names from result metadata.
  const columns = Array.isArray(result.meta.fields)
    ? result.meta.fields.map((name) => ({ key: name, name }))
    : [];

  // Get the row content from the result data.
  const rows = result.data;

  return (
    <Container fluid>
      <Row className={"pb-3"}>
        <Col>
          <CodeMirror
            readOnly
            theme={"dark"}
            // TODO: Consider implementing a CodeMirror language extension for CSV/TSV files.
            //       See: https://gist.github.com/rooks/6a13affb544ef8bc338b49af7d018318
            extensions={[highlightWhitespace()]}
            value={changesheetContent}
          />
        </Col>
      </Row>
      <Row className={"pb-3"}>
        <Col>
          <DataGrid columns={columns} rows={rows} />
        </Col>
      </Row>
      <Row>
        <Col>
          <CodeMirror
            readOnly
            theme={"dark"}
            extensions={[langs.json()]}
            value={makePayloads(result.data)}
          />
        </Col>
      </Row>
    </Container>
  );
}

export default App;
