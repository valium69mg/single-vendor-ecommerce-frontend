import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type Table as TableType,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  page: number;
  setPage: (page: number) => void;
  hasNextPage: boolean;
  loading: boolean;
  labels: {
    previous: string;
    next: string;
    page: string;
    noResults: string;
  };
}

function DataTableHeader<TData>({ table }: { table: TableType<TData> }) {
  return (
    <TableHeader>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <TableHead key={header.id}>
              {header.isPlaceholder
                ? null
                : flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
            </TableHead>
          ))}
        </TableRow>
      ))}
    </TableHeader>
  );
}

function DataTableBody<TData>({
  table,
  columns,
  noResultsLabel,
}: {
  table: TableType<TData>;
  columns: ColumnDef<TData>[];
  noResultsLabel: string;
}) {
  return (
    <TableBody>
      {table.getRowModel().rows.length ? (
        table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))
      ) : (
        <TableRow>
          <TableCell colSpan={columns.length} className="text-center">
            {noResultsLabel}
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  );
}

function DataTablePagination({
  page,
  setPage,
  hasNextPage,
  labels,
}: {
  page: number;
  setPage: (page: number) => void;
  hasNextPage: boolean;
  labels: {
    previous: string;
    next: string;
    page: string;
    noResults: string;
  };
}) {
  return (
    <div className="flex justify-end gap-3">
      <Button
        variant="outline"
        disabled={page === 0}
        onClick={() => setPage(page - 1)}
      >
        {labels.previous}
      </Button>

      <span className="flex items-center text-sm text-muted-foreground">
        {labels.page} {page + 1}
      </span>

      <Button
        variant="outline"
        disabled={!hasNextPage}
        onClick={() => setPage(page + 1)}
      >
        {labels.next}
      </Button>
    </div>
  );
}

export function DataTable<TData>({
  columns,
  data,
  page,
  setPage,
  hasNextPage,
  labels,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <Table>
        <DataTableHeader table={table} />
        <DataTableBody
          table={table}
          columns={columns}
          noResultsLabel={labels.noResults}
        />
      </Table>
      <DataTablePagination
        page={page}
        setPage={setPage}
        hasNextPage={hasNextPage}
        labels={labels}
      />
    </div>
  );
}
