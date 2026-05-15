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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X, Filter, ChevronDown, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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
  
  const [startDate, setStartDate] = useState(currentStartDate);
  const [endDate, setEndDate] = useState(currentEndDate);
  const [workerId, setWorkerId] = useState(currentWorkerId);

  const hasActiveFilters = currentStartDate || currentEndDate || (currentWorkerId && currentWorkerId !== 'all');

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    startDate ? params.set('startDate', startDate) : params.delete('startDate');
    endDate ? params.set('endDate', endDate) : params.delete('endDate');
    (workerId && workerId !== 'all') ? params.set('workerId', workerId) : params.delete('workerId');
    router.push(`?${params.toString()}`);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setWorkerId('');
    router.push('?'); // Clear URL params
  };

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "h-9 gap-2 border-dashed",
              hasActiveFilters && "border-brand-clay-400 bg-brand-clay-400/5 text-brand-clay-400"
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filters</span>
            {hasActiveFilters && (
               <span className="ml-1 px-1.5 py-0.5 rounded-full bg-brand-clay-400 text-white text-[10px]">
                 Active
               </span>
            )}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80 p-5" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm">Filter Records</h4>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs">
                Reset
              </Button>
            </div>
            
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-[11px] font-bold uppercase text-muted-foreground">Date Range</label>
                <div className="flex items-center gap-2">
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8 text-xs" />
                  <span className="text-muted-foreground">-</span>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-8 text-xs" />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-[11px] font-bold uppercase text-muted-foreground">Worker</label>
                <Select value={workerId} onValueChange={setWorkerId}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All workers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All workers</SelectItem>
                    {workers.map((w) => (
                      <SelectItem key={w.id} value={w.id}>{w.name || 'Unnamed'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button className="w-full bg-brand-clay-400 hover:bg-brand-clay-500" onClick={applyFilters}>
              Apply Filters
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Quick Clear Button (Visible only when filters active) */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-muted-foreground hover:text-foreground">
          <X className="h-3 w-3 mr-1" /> 
        </Button>
      )}
    </div>
  );
}