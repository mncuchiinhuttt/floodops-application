import type { Graph, Knowledge, OperationalBranch, VehicleType } from "@floodops/contracts";
import { Button, DataTable, StatusBadge } from "@floodops/ui-web";
import { entityMarkers, segmentState } from "./map-model";
export function MapLists({ graph, knowledge, branch, vehicle, minute, knowledgeCurrent, onSelect }: { graph: Graph; knowledge: Knowledge | null; branch: OperationalBranch | null; vehicle: VehicleType; minute: number; knowledgeCurrent: boolean; onSelect: (id: string) => void }) {
  return <><DataTable caption="Các đoạn đường trên map" rows={graph.segments} rowKey={segment => segment.segment_id} columns={[
    { key: "id", label: "Đoạn / hướng", render: segment => <Button variant="secondary" onClick={() => onSelect(segment.segment_id)}>{`${segment.segment_id}: ${segment.from_node_id} → ${segment.to_node_id}`}</Button> },
    { key: "state", label: `Knowledge ${vehicle}`, render: segment => <StatusBadge {...segmentState(segment, knowledge, vehicle, minute, knowledgeCurrent)} /> },
    { key: "length", label: "Chiều dài server", render: segment => `${segment.length_m} m` },
    { key: "scope", label: "Loại xe / nguồn", render: segment => `${segment.allowed_vehicle_types.join(", ")} · ${segment.provenance.map(item => item.label).join(", ")}` },
  ]} />
    <DataTable caption="Thực thể nhánh đang chọn" rows={entityMarkers(graph, branch)} rowKey={marker => marker.id} emptyLabel="Không có dữ liệu vận hành được cung cấp." columns={[
      { key: "id", label: "Thực thể", render: marker => <Button variant="secondary" onClick={() => onSelect(marker.id)}>{marker.label}</Button> },
      { key: "position", label: "Vị trí / trạng thái", render: marker => <>{marker.detail}<p>{marker.coordinate ? `${marker.coordinate[0]}, ${marker.coordinate[1]}` : "Tọa độ unavailable"}</p></> },
    ]} />
  </>;
}
