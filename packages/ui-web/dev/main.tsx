import { createRoot } from "react-dom/client";
import { FoundationsGallery } from "../src/foundations-gallery";
const container = document.getElementById("root");
if (!container) throw new Error("Gallery root is missing.");
createRoot(container).render(<FoundationsGallery />);
