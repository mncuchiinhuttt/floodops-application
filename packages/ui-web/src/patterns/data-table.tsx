import { useId } from "react";
import type { ReactNode } from "react";
import { Alert, Skeleton } from "../primitives/content";
export type TableColumn<Row> = { key: string; label: string; render: (row: Row) => ReactNode };
export type DataTableProps<Row> = {
  caption: string; columns: readonly TableColumn<Row>[]; rows: readonly Row[]; rowKey: (row: Row) => string;
  loading?: boolean; error?: string; emptyLabel?: string;
};
export function DataTable<Row>({ caption, columns, rows, rowKey, loading, error, emptyLabel = "No entries" }: DataTableProps<Row>) {
  const prefix = useId();
  if (!caption.trim() || !columns.length || columns.some(column => !column.label.trim())) throw new Error("Tables require a caption and labelled columns.");
  if (error) return <Alert title={caption} urgent>{error}</Alert>;
  if (loading) return <Skeleton label={`Loading ${caption}`} />;
  if (!rows.length) return <section aria-label={caption}><p>{emptyLabel}</p></section>;
  return <table className="fo-data-table" role="table"><caption>{caption}</caption>
    <thead><tr role="row">{columns.map((column, index) => <th key={column.key} id={`${prefix}-column-${index}`} scope="col" role="columnheader">{column.label}</th>)}</tr></thead>
    <tbody>{rows.map(row => <tr key={rowKey(row)} role="row">{columns.map((column, index) =>
      <td key={column.key} role="cell" headers={`${prefix}-column-${index}`}>
        <span className="fo-cell-label" aria-hidden="true">{column.label}</span><div>{column.render(row)}</div>
      </td>)}</tr>)}</tbody>
  </table>;
}
export function KeyValueList({ items }: { items: readonly { label: string; value: ReactNode }[] }) {
  return <dl className="fo-key-values">{items.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>;
}
