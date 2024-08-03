import { parse } from "papaparse";
import "./App.css";

const csvStr = `
product,price
apple,1.2
banana,.50
carrot,1

egg,4.50
`.trim();

function App() {
  const parseResult = parse<string[][]>(csvStr, { skipEmptyLines: true });
  return <>{JSON.stringify(parseResult.data)}</>;
}

export default App;
