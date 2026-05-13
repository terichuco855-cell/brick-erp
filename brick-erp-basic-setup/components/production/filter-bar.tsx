'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  currentStartDate: string;
  currentEndDate: string;
  currentWorkerId: string;
  workers: { id: string; name: string | null }[];
}

export function FilterBar({
  currentStartDate,
  currentEndDate,
  currentWorkerId,
  workers,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Local state for instant updates (optional)
  const [startDate, setStartDate] = useState(currentStartDate);
  const [endDate, setEndDate] = useState(currentEndDate);
  const [workerId, setWorkerId] = useState(currentWorkerId);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (startDate) params.set('startDate', startDate);
    else params.delete('startDate');

    if (endDate) params.set('endDate', endDate);
    else params.delete('endDate');

    if (workerId && workerId !== 'all') params.set('workerId', workerId);
    else params.delete('workerId');

    router.push(`?${params.toString()}`);
    setFiltersOpen(false); // close on mobile after apply
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setWorkerId('');
    router.push(''); // remove all params
    setFiltersOpen(false);
  };

  const hasActiveFilters =
    currentStartDate ||
    currentEndDate ||
    (currentWorkerId && currentWorkerId !== 'all');

  return (
    <div>
      {/* Mobile toggle button */}
      <div className="sm:hidden mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          Filters {hasActiveFilters && '(active)'}
        </Button>
      </div>

      {/* Filter panel – visible on desktop, collapsible on mobile */}
      <div
        className={cn(
          'flex flex-col sm:flex-row gap-3 items-start sm:items-center p-4 bg-muted/30 rounded-lg',
          'sm:flex', // always show on sm+
          filtersOpen ? 'block' : 'hidden' // toggle on mobile
        )}
      >
        <div className="w-full sm:w-auto">
          <label className="text-xs text-muted-foreground">Start Date</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1"
          />
        </div>

        <div className="w-full sm:w-auto">
          <label className="text-xs text-muted-foreground">End Date</label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1"
          />
        </div>

        <div className="w-full sm:w-48">
          <label className="text-xs text-muted-foreground">Worker</label>
          <Select value={workerId} onValueChange={setWorkerId}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="All workers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All workers</SelectItem>
              {workers.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name || w.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 self-end sm:self-center mt-2 sm:mt-0">
          <Button size="sm" onClick={applyFilters}>
            Apply
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
          >
            <X className="h-4 w-4 mr-1" /> Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
