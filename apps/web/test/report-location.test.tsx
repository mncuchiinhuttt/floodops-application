import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { SubmitReportInput } from "@floodops/contracts";
import { ReportForm } from "../src/features/reports/report-form";
import { identity, now, report } from "../preview/fixtures";
const context = (role: "contributor") => ({ identity: identity(role), online: true, now });
afterEach(cleanup);
test("report transmits explicit WGS84 coordinate with normalized media and requires paired coordinates", async () => {
  const submit = vi.fn<(input: SubmitReportInput) => Promise<void>>(async () => undefined);
  render(<ReportForm kind="citizen" context={context("contributor")} preferredMediaId="media_test001" mediaChoices={[{ id: "media_test001", kind: "media", label: "Normalized" }]} onSubmit={submit} />);
  fireEvent.change(screen.getByLabelText("Đoạn đường (required)"), { target: { value: "segment_E270001" } });
  fireEvent.change(screen.getByLabelText("Thời gian chụp RFC3339 (required)"), { target: { value: report.captured_at } });
  fireEvent.change(screen.getByLabelText("Loại xe quan sát"), { target: { value: "motorbike" } });
  fireEvent.change(screen.getByLabelText("Kinh độ WGS84"), { target: { value: "106.701" } });
  fireEvent.submit(screen.getByRole("form", { name: "Gửi báo cáo" })); expect(submit).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Vĩ độ WGS84"), { target: { value: "10.7705" } });
  fireEvent.submit(screen.getByRole("form", { name: "Gửi báo cáo" }));
  await waitFor(() => expect(submit).toHaveBeenCalledWith(expect.objectContaining({ coordinate: [106.701, 10.7705], media_id: "media_test001", fixture_photo_id: null })));
}, 20000);
