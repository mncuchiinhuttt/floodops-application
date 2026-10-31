import { useId } from "react";
import type { ReactNode } from "react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
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
  if (!rows.length) return <section aria-label={caption}><p className="m-0 rounded-lg border border-dashed p-4 text-center text-muted-foreground">{emptyLabel}</p></section>;
  return <Table role="table" className="min-w-max sm:min-w-full">
    <TableCaption className="sr-only">{caption}</TableCaption>
    <TableHeader><TableRow role="row">{columns.map((column, index) => <TableHead key={column.key} id={`${prefix}-column-${index}`} scope="col" role="columnheader"
      className="h-10 whitespace-nowrap text-xs font-medium uppercase tracking-wide text-muted-foreground">{column.label}</TableHead>)}</TableRow></TableHeader>
    <TableBody>{rows.map(row => <TableRow key={rowKey(row)} role="row">{columns.map((column, index) =>
      <TableCell key={column.key} role="cell" headers={`${prefix}-column-${index}`} className="whitespace-normal py-3 align-top tabular-nums [overflow-wrap:anywhere]">
        <div>{column.render(row)}</div>
      </TableCell>)}</TableRow>)}</TableBody>
  </Table>;
}
export function KeyValueList({ items }: { items: readonly { label: string; value: ReactNode }[] }) {
  return <dl className="m-0 grid divide-y divide-border">{items.map(item => <div key={item.label} className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-3 py-2 text-sm [overflow-wrap:anywhere]">
    <dt className="text-muted-foreground">{item.label}</dt><dd className="m-0 font-medium tabular-nums">{item.value}</dd></div>)}</dl>;
}
