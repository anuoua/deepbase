import { createRoot } from "react-dom/client";
import { App } from "./App";

createRoot(document.querySelector("#app")!, {
  onUncaughtError(error, errorInfo) {
    console.log(error);
    console.log(errorInfo);
  },
}).render(<App />);
