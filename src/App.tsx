import { parse } from "papaparse";
import DataGrid from "react-data-grid";
import CodeMirror from "@uiw/react-codemirror";
import { langs } from "@uiw/codemirror-extensions-langs";
import "react-data-grid/lib/styles.css";

const csvStr = `
product,price
apple,1.2
banana,.50
carrot,1

egg,4.50
french toast,10.00
,.99
halo halo,
,
jello
`.trim();

// FIXME: Instead of returning a mostly hard-coded value, examine the row and return something more specific to the row.
// Reference: https://api.microbiomedata.org/docs#/queries/run_query_queries_run_post
const makePayload = (row: string[]): object => {
  return {
    update: "foo_set",
    updates: [{ q: { id: row[0] }, u: { $set: { name: row[1] } } }],
  };
};

const makePayloads = (rows: string[][]): string => {
  const payloads = rows.map((row) => makePayload(row));
  return JSON.stringify(payloads, null, 2);
};

function App() {
  const parseResult = parse<string[]>(csvStr, { skipEmptyLines: true });

  // Get column names from first parsed row.
  const columns = parseResult.data[0].map((columnName) => ({
    key: columnName,
    name: columnName,
  }));

  // Get data row content from the second parsed row and onward.
  const rows = parseResult.data.slice(1).map((parsedRow) => {
    const row: Record<string, string> = {};
    columns.forEach((column, index) => {
      row[column.key] = parsedRow[index];
    });
    return row;
  });

  return (
    <>
      <div style={{ marginBottom: 8, padding: 8, border: "1px solid yellow" }}>
        <pre>{csvStr}</pre>
      </div>
      <div style={{ marginBottom: 8, padding: 8, border: "1px solid green" }}>
        <code>{JSON.stringify(parseResult.data)}</code>
      </div>
      <div style={{ marginBottom: 8 }}>
        <DataGrid columns={columns} rows={rows} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <CodeMirror
          readOnly
          theme={"dark"}
          extensions={[langs.json()]}
          value={makePayloads(parseResult.data)}
        />
      </div>
    </>
  );
}

export default App;
