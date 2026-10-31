import { createRoot } from "react-dom/client";
import { createApplication } from "../router";
import { WebApplication } from "./application";
import "./styles.css";
const root = document.getElementById("root");
if (!root) throw new Error("Missing FloodOps root");
const application = createApplication();
createRoot(root).render(<WebApplication application={application} />);
