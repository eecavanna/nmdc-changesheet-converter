import { useRef, useState } from "react";
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
import {
  Alert,
  Button,
  Col,
  Collapse,
  Container,
  OverlayTrigger,
  Row,
  Stack,
  ToggleButton,
  Tooltip,
} from "react-bootstrap";
import { AboutMessageTooltipTrigger } from "./components/misc.tsx";
import { makePayloads } from "./lib/payload.ts";
import copy from "copy-to-clipboard";

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

  const [isDebugSectionVisible, setIsDebugSectionVisible] =
    useState<boolean>(false);

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

  const [isCopiedIndicatorVisible, setIsCopiedIndicatorVisible] =
    useState<boolean>(false);

  const timeoutIdRef = useRef<NodeJS.Timeout | undefined>();

  const onClickCopy = () => {
    // Copy the payloads to the clipboard.
    copy(payloads, {
      format: "text/plain",
      onCopy: () => {
        // Cancel any already-scheduled hiding of the indicator.
        if (timeoutIdRef.current !== undefined) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = undefined;
        }

        // Show the indicator.
        setIsCopiedIndicatorVisible(true);

        // Schedule a hiding of the indicator.
        timeoutIdRef.current = setTimeout(() => {
          setIsCopiedIndicatorVisible(false);
        }, 2000);
      },
    });
  };

  return (
    <Container fluid className={"p-3"}>
      <Row className={"pb-3"}>
        <Col>
          <Alert variant={"warning"} dismissible>
            <p>
              This tool is a proof of concept based upon a conversation about
              changesheet usability that took place during a hackathon. I
              recommend you <strong>not</strong> use it for anything beyond
              experimentation and as a conversation piece.
            </p>
            <p className={"mb-0"}>
              Some of its shortcomings are: It does not determine collection
              names yet. It does not handle nested attributes yet (e.g.{" "}
              <code>depth.has_raw_value</code>). It does not parse values into
              data types other than strings yet. It does not consolidate
              consecutive operations having the same action and involving the
              same collection into a single payload yet. You can learn about its
              shortcomings by reading the <samp>TODO</samp> and{" "}
              <samp>FIXME</samp> comments in its source code.
            </p>
          </Alert>
          <h1>
            Changesheet converter <AboutMessageTooltipTrigger />
          </h1>
          <p>
            Drop a changesheet into the &quot;Changesheet&quot; field, then copy
            the resulting payloads from the &quot;Payloads&quot; section.
          </p>
        </Col>
      </Row>
      <Row className={"pb-3"}>
        <Col>
          <Stack
            direction={"horizontal"}
            gap={3}
            className={"justify-content-between"}
          >
            <h2>Changesheet</h2>
            <ToggleButton
              className={"mb-1"}
              variant={"secondary"}
              size={"sm"}
              id={"toggle-is-debug-section-visible"}
              type={"checkbox"}
              checked={isDebugSectionVisible}
              value={1}
              onChange={(e) =>
                setIsDebugSectionVisible(e.currentTarget.checked)
              }
              title={
                isDebugSectionVisible
                  ? "Hide intermediate conversion stages"
                  : "Show intermediate conversion stages"
              }
            >
              {isDebugSectionVisible ? "Hide " : "Show "} intermediate stages
            </ToggleButton>
          </Stack>
          <p>Drop a changesheet file or paste the changesheet contents here.</p>
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
      <Collapse in={isDebugSectionVisible}>
        <div>
          <Row className={"pb-3"}>
            <Col>
              <h2>Changesheet as table (raw)</h2>
              <p>
                Here&apos;s a table showing the changesheet contents verbatim.
              </p>
              <DataGrid columns={columns} rows={rows} />
            </Col>
          </Row>
          <Row
            className={"pb-3"}
            style={failedToInferStuff ? { filter: "blur(8px)" } : {}}
          >
            <Col>
              <h2>Changesheet as table (dense)</h2>
              <p>
                Here&apos;s a table in which all empty <code>id</code> and{" "}
                <code>action</code> cells, if any, have been filled in using the
                most recent non-empty value in that column.
              </p>
              <DataGrid columns={columns} rows={rowsExplicit} />
            </Col>
          </Row>
        </div>
      </Collapse>
      <Row style={failedToInferStuff ? { filter: "blur(8px)" } : {}}>
        <Col>
          <h2>Payloads</h2>
          <p>
            Here are the equivalent HTTP request payloads for the{" "}
            <code>/queries:run</code> endpoint of the NMDC Runtime API.
          </p>
          {/* TODO: Once we know the collection names, combine consecutive payloads involving the same collection. */}
          <div className={"position-relative"}>
            <CodeMirror
              editable={false}
              theme={"dark"}
              extensions={[langs.json()]}
              value={payloads}
            />
            <div
              className={"position-absolute"}
              style={{ top: 0, right: 0, padding: 8 }}
            >
              <OverlayTrigger
                show={isCopiedIndicatorVisible}
                overlay={
                  <Tooltip id={"copied-indicator-tooltip"}>Copied</Tooltip>
                }
              >
                <Button
                  size={"sm"}
                  variant={"secondary"}
                  onClick={onClickCopy}
                  title={"Copy to clipboard"}
                >
                  {isCopiedIndicatorVisible ? (
                    <i className="bi bi-clipboard-check"></i>
                  ) : (
                    <i className="bi bi-clipboard"></i>
                  )}
                </Button>
              </OverlayTrigger>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
