import type { Preview } from "@storybook/react-vite";
import "./preview.css";
const preview: Preview = {
  parameters: { layout: "fullscreen", a11y: { test: "error" }, controls: { expanded: true } },
  decorators: [Story => <main className="fo-story"><h1 className="fo-sr-only">FloodOps component review</h1><Story /></main>]
};
export default preview;
