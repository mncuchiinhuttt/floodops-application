import { useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { SelectedImage } from "@floodops/design-tokens";
import { ImagePickerField } from "../src/index";
afterEach(cleanup);
function Example() {
  const [images, setImages] = useState<SelectedImage[]>([]);
  return <ImagePickerField label="Report images" images={images} onFilesSelected={files => setImages(files.map((file, index) => ({ id: String(index), label: file.name })))}
    onRemove={id => setImages(values => values.filter(image => image.id !== id))} />;
}
test("image selection and removal change only the controlled selected list", () => {
  render(<Example />);
  fireEvent.change(screen.getByLabelText("Report images"), { target: { files: [new File(["synthetic"], "example.png", { type: "image/png" })] } });
  expect(screen.getByText("1 selected image")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Remove example.png" }));
  expect(screen.getByText("0 selected images")).toBeDefined();
});
test("pending image processing exposes busy/disabled and blocks picker/removal actions", () => {
  const remove = vi.fn();
  render(<ImagePickerField label="Images" images={[{ id: "one", label: "One" }]} onFilesSelected={vi.fn()} onRemove={remove} pending />);
  const picker = screen.getByLabelText("Images") as HTMLInputElement;
  expect(picker.disabled).toBe(true);
  expect(picker.getAttribute("aria-busy")).toBe("true");
  fireEvent.click(screen.getByRole("button", { name: "Processing One" }));
  expect(remove).not.toHaveBeenCalled();
});
