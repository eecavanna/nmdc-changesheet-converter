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
import { AboutMessageTooltipTrigger } from "./components/misc.tsx";
import { makePayloads } from "./lib/payload.ts";

// Note: This string was copy/pasted from: `src/lib/test-data/vendor/changesheet-without-separator1.tsv`
const initialChangesheetContent = `
id	action	attribute	value
gold:Gs0103573	update	name	NEW NAME 1
		ecosystem	SOIL
gold:Gs0114663	update	doi	v1
v1		has_raw_value	10.9999/8888
	update	name	NEW NAME 2
	update	principal_investigator	v2
v2		has_raw_value	NEW RAW VALUE 2
`.trim();

// TODO: Consider showing an error message when the changesheet doesn't contain the columns we expect;
//       in general, consider validating the changesheet to some extent.

function App() {
  const [editorValue, setEditorValue] = useState<string>(
    initialChangesheetContent,
  );
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
    <Container fluid className={"p-3"}>
      <Row className={"pb-3"}>
        <Col>
          <h1>
            Changesheet converter <AboutMessageTooltipTrigger />
          </h1>
          <p>
            Drop a changesheet into the &quot;Changesheet&quot; field, then copy
            the resulting payloads from the &quot;Equivalent Payloads&quot; section.
          </p>
        </Col>
      </Row>
      <Row className={"pb-3"}>
        <Col>
          <h3>Changesheet</h3>
          <CodeMirror
            autoFocus
            height={"200px"}
            placeholder={"Paste or drop your changesheet here..."}
            theme={"dark"}
            // TODO: Consider implementing a CodeMirror language extension for CSV/TSV files.
            //       See: https://gist.github.com/rooks/6a13affb544ef8bc338b49af7d018318
            // TODO: Consider allowing the user to toggle the `highlightWhitespace` extension on/off.
            extensions={[highlightWhitespace(), codeMirrorExtensions.tab()]}
            onDrop={() => setEditorValue("")} // empties the editor before dropping content
            onChange={setEditorValue}
            value={editorValue}
            indentWithTab={false} // we handle [TAB] key presses, with a custom extension instead
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
          {/* TODO: Once we know the collection names, combine consecutive payloads involving the same collection. */}
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
