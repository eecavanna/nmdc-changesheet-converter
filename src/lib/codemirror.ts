import { keymap } from "@uiw/react-codemirror";
import { insertTab } from "@codemirror/commands";

// CodeMirror extensions.
export const codeMirrorExtensions = {
  /**
   * The "tab" extension makes it so that, when the user presses the `TAB` key, CodeMirror inserts a tab character
   * _at the cursor_ instead of indenting the entire line.
   *
   * Note: In order to use this extension, the developer must set the component's `indentWithTab` prop to `false`.
   *
   * Reference: https://github.com/uiwjs/react-codemirror/issues/432#issuecomment-1421482370
   *            (Thank you, Ilia Andrienko, at https://github.com/andrienko, for sharing this solution)
   */
  tab: () => keymap.of([{ key: "Tab", run: insertTab }]),
};
