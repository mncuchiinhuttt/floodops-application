import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import { usePrivateDraft } from "../src/features/reports/data/use-private-draft";
import { ReportForm } from "../src/features/reports/report-form";
import { newReportDraft, type ReportDraft } from "../src/features/reports/report-draft";
import { fixtureContext } from "../preview/fixture-data";
import { captureTime } from "../src/features/reports/capture-time";
test("fast configuration cannot mount a fresh form before a deferred private restore completes", async () => {
  const context = fixtureContext("driver"), cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let resolve!: (draft: ReportDraft | null) => void;
  const load = jest.fn(() => new Promise<ReportDraft | null>(done => { resolve = done; }));
  const saved = newReportDraft(context, "2026-10-31T00:02:00Z"); saved.description = "Preserved capture"; saved.simMinute = "2";
  const storage = { load, save: jest.fn(async () => undefined) };
  const fresh = jest.fn(() => newReportDraft(context, captureTime("2026-10-31T00:00:00Z", 10)));
  function Editor() {
    const { query } = usePrivateDraft({ session_id: context.session.session_id, generation: context.session.generation, participantId: context.participant.participant_id }, storage);
    if (!query.isSuccess) return <Text>Restoring private capture</Text>;
    return <ReportForm context={context} initialDraft={query.data ?? fresh()} />;
  }
  await render(<QueryClientProvider client={cache}><Editor /></QueryClientProvider>);
  expect(screen.queryByLabelText("Description")).toBeNull(); expect(fresh).not.toHaveBeenCalled();
  await act(async () => { resolve(saved); });
  await waitFor(() => expect(screen.getByDisplayValue("Preserved capture")).toBeOnTheScreen());
  expect(screen.getByDisplayValue("2026-10-31T00:02:00Z")).toBeOnTheScreen(); expect(fresh).not.toHaveBeenCalled();
  await act(async () => { await cache.invalidateQueries({ queryKey: ["native", context.session.session_id] }); });
  expect(load).toHaveBeenCalledTimes(1); await screen.unmount(); cache.clear();
});
