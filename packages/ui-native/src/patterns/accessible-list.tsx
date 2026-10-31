import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { Alert, Skeleton } from "../primitives/content";
import { styles } from "../primitives/styles";
export type ListColumn<Row> = { key: string; label: string; render: (row: Row) => ReactNode };
export type AccessibleListProps<Row> = {
  caption: string; columns: readonly ListColumn<Row>[]; rows: readonly Row[]; rowKey: (row: Row) => string;
  loading?: boolean; error?: string; emptyLabel?: string;
};
export function AccessibleList<Row>({ caption, columns, rows, rowKey, loading, error, emptyLabel = "No entries" }: AccessibleListProps<Row>) {
  if (!caption.trim() || !columns.length || columns.some(column => !column.label.trim())) throw new Error("Lists require a caption and labelled columns.");
  if (error) return <Alert title={caption} urgent>{error}</Alert>;
  if (loading) return <Skeleton label={`Loading ${caption}`} />;
  return <View style={styles.group}><Text accessibilityRole="header" style={styles.heading}>{caption}</Text>
    {!rows.length && <Text style={styles.hint}>{emptyLabel}</Text>}
    {rows.map(row => <View key={rowKey(row)} style={styles.card}>
      {columns.map(column => <View key={column.key} style={styles.group}><Text style={styles.label}>{column.label}</Text>
        <Value>{column.render(row)}</Value></View>)}
    </View>)}
  </View>;
}
export function KeyValueList({ items }: { items: readonly { label: string; value: ReactNode }[] }) {
  return <View style={styles.group}>{items.map(item => <View key={item.label} style={styles.group}>
    <Text style={styles.label}>{item.label}</Text><Value>{item.value}</Value>
  </View>)}</View>;
}

function Value({ children }: { children: ReactNode }) {
  return typeof children === "string" || typeof children === "number" ? <Text style={styles.hint}>{children}</Text> : <View>{children}</View>;
}
