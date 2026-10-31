import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RequestCancelledError } from "@floodops/api-client";
import type { Meta, VehicleType } from "@floodops/contracts";
import { Alert, SelectField } from "@floodops/ui-web";
import { useRuntime, useRuntimeSnapshot } from "./context";
import { readOptions, resourceOf } from "./queries";
import { ResourceView } from "../shared/feature-state";
import { GeometryMap } from "../features/operations-map/geometry-map";
import { OsmOverview } from "../features/operations-map/osm-overview";
import { failureText } from "./failure";

export function DispatcherMapRoute() {
  const runtime = useRuntime(); useRuntimeSnapshot(); const context = runtime.context(), { session, participant } = context.identity;
  const [vehicle, setVehicle] = useState<VehicleType>("motorbike"), [branchId, setBranchId] = useState("floodops");
  const path = { session_id: session.session_id }, prefix = ["session", session.session_id, session.generation, participant.participant_id];
  const graph = useQuery(readOptions(runtime, "getSessionGraph", "scenario:read", "dispatcher", { path }));
  const knowledge = useQuery(readOptions(runtime, "getKnowledge", "knowledge:read", "dispatcher", { path }));
  const operations = useQuery(readOptions(runtime, "getOperations", "operations:read", "dispatcher", { path }));
  const snapshot = useQuery(readOptions(runtime, "getSessionSnapshot", "operations:read", "dispatcher", { path }));
  const current = (meta: Meta | undefined) => !!meta && meta.session_id === session.session_id && meta.generation === session.generation && meta.revision === session.revision;
  const operationData = operations.isSuccess && current(operations.data.body.meta) ? operations.data.body.data :
    snapshot.isSuccess && current(snapshot.data.body.meta) ? snapshot.data.body.data.operations : null;
  const branch = operationData?.branches.find(item => item.branch_id === branchId) ?? operationData?.branches[0] ?? null;
  const activeIds = branch?.active_route_ids ?? [], scope = context.scope, epoch = runtime.snapshot().epoch;
  const routes = useQuery({ queryKey: [...prefix, "map-routes", branch?.branch_id, session.revision, activeIds], enabled: !!branch && !!activeIds.length,
    queryFn: async ({ signal }) => {
      if (signal.aborted || runtime.snapshot().epoch !== epoch || runtime.context().scope !== scope) throw new RequestCancelledError();
      const responses = await Promise.all(activeIds.map(route_id => runtime.bound.read("getRoute", "operations:read", "dispatcher", { path: { ...path, route_id } }, signal)));
      if (responses.some(response => !current(response.body.meta))) throw new RequestCancelledError();
      return responses.map(response => response.body.data);
    },
  });
  const knowledgeCurrent = knowledge.isSuccess && current(knowledge.data.body.meta);
  return <div className="grid min-w-0 gap-4"><h1>Bản đồ geometry server</h1>
    <div className="feature-actions"><SelectField label="Loại xe trên map" value={vehicle} onValueChange={value => {
      if (value === "motorbike" || value === "car" || value === "truck") setVehicle(value);
    }} options={[{ value: "motorbike", label: "Xe máy" }, { value: "car", label: "Ô tô" }, { value: "truck", label: "Xe tải" }]} />
      <SelectField label="Nhánh vận hành" value={branch?.branch_id ?? ""} disabled={!operationData} onValueChange={setBranchId}
        options={operationData?.branches.map(item => ({ value: item.branch_id, label: item.branch_id })) ?? [{ value: "", label: "Operations unavailable" }]} />
    </div>
    {!knowledgeCurrent && <Alert title="Knowledge unavailable / chưa current">{knowledge.isError ? failureText(knowledge.error) : "Đang làm mới knowledge theo loại xe."} Closure đã nhận vẫn giữ; phần còn lại hiển thị unknown.</Alert>}
    {!operationData && <Alert title="Fleet / operations unavailable">{operations.isError ? failureText(operations.error) : "Chưa có snapshot vận hành đúng revision."} Không vẽ fleet giả.</Alert>}
    {routes.isError && <Alert title="Route unavailable">{failureText(routes.error)}</Alert>}
    <ResourceView resource={resourceOf(graph)}>{data => <>
      <OsmOverview graph={data} knowledge={knowledge.data?.body.data ?? null} knowledgeCurrent={knowledgeCurrent} branch={branch} vehicle={vehicle} minute={session.sim_minute}
        routes={routes.isSuccess && !routes.isFetching ? routes.data : []} />
      <details className="rounded-xl border bg-card p-4"><summary className="cursor-pointer text-sm font-medium">Sơ đồ SVG, chú giải và danh sách thực thể</summary>
        <div className="mt-4"><GeometryMap key={`${session.session_id}:${session.generation}:${data.graph_hash}`} graph={data}
          knowledge={knowledge.data?.body.data ?? null} knowledgeCurrent={knowledgeCurrent} branch={branch} vehicle={vehicle} minute={session.sim_minute}
          routes={routes.isSuccess && !routes.isFetching ? routes.data : []} /></div></details></>}</ResourceView>
  </div>;
}
