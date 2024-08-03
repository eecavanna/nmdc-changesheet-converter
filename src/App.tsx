import DataGrid from "react-data-grid";
import CodeMirror from "@uiw/react-codemirror";
import { langs } from "@uiw/codemirror-extensions-langs";
import { parseChangesheetContent, Row as CSRow } from "./lib/changesheet.ts";
import "react-data-grid/lib/styles.css";
import { Col, Container, Row } from "react-bootstrap";

const csvStr = `
id,action,attribute,value
1,foo,bar,baz
2,moo,mar,maz
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
  const result = parseChangesheetContent(csvStr);

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
            extensions={[langs.json()]}
            value={csvStr}
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
