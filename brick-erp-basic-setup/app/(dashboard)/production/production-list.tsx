'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { formatKs } from '@/lib/utils/erp-logic';

interface ProductionLogItem {
  id: string;
  worker: { name: string | null } | null;
  bricksProduced: number;
  netYield: number;
  totalCost: number;
  productionDate: string | Date;
}

interface Props {
  logs: ProductionLogItem[];
}

export function ProductionList({ logs }: Props) {
  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        No production logs yet.
      </div>
    );
  }

  return (
    <>
      {/* Mobile Cards – visible only below `md` breakpoint */}
      <div className="md:hidden space-y-3">
        {logs.map((log) => (
          <Card key={log.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-sm">
                    {format(new Date(log.productionDate), 'dd MMM yyyy')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {log.worker?.name || '—'}
                  </p>
                </div>
                <span className="text-sm font-mono">
                  {log.bricksProduced.toLocaleString()} pcs
                </span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Net Yield</span>
                <span className="font-medium text-foreground">
                  {log.netYield.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Total Cost</span>
                <span className="font-medium text-foreground">
                  {formatKs(log.totalCost)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table – visible from `md` and above */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Worker</TableHead>
                <TableHead className="text-right">Produced</TableHead>
                <TableHead className="text-right">Net Yield</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {format(new Date(log.productionDate), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell>{log.worker?.name || '—'}</TableCell>
                  <TableCell className="text-right">
                    {log.bricksProduced.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {log.netYield.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatKs(log.totalCost)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
