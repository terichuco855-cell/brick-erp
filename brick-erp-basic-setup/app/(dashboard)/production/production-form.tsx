'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Plus } from 'lucide-react';
import { createProductionLog } from '@/lib/actions/production';
import { suggestMaterials, calcBatchResult } from '@/lib/utils/erp-logic';
import { Card, CardContent } from '@/components/ui/card';

// Zod schema
const productionSchema = z.object({
  workerId: z.string().min(1, 'Worker is required'),
  bricksProduced: z.coerce.number().int().positive('Must be at least 1'),
  wastageCount: z.coerce.number().int().min(0),
  cementUsed: z.coerce.number().min(0),
  sandUsed: z.coerce.number().min(0),
  dieselUsed: z.coerce.number().min(0),
});

type ProductionFormValues = z.infer<typeof productionSchema>;

interface Props {
  settings: {
    cementRatio: number;
    sandRatio: number;
    dieselRatio: number;
    cementUnitCost: number;
    sandUnitCost: number;
    dieselUnitCost: number;
    laborRate: number;
    salesPricePerUnit: number;
    maintenanceReservePerUnit: number;
  };
  workers: { id: string; name: string | null }[];
  currentUser: { id: string; role: 'ADMIN' | 'WORKER' };
}

export function ProductionForm({ settings, workers, currentUser }: Props) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultWorkerId =
    currentUser.role === 'WORKER'
      ? currentUser.id
      : workers.length === 1
      ? workers[0].id
      : '';

  const form = useForm<ProductionFormValues>({
    resolver: zodResolver(productionSchema),
    defaultValues: {
      workerId: defaultWorkerId,
      bricksProduced: 0,
      wastageCount: 0,
      cementUsed: 0,
      sandUsed: 0,
      dieselUsed: 0,
    },
  });

  const watchedBricks = form.watch('bricksProduced');

  // Auto‑suggest materials when bricks count changes
  const suggestion = suggestMaterials(watchedBricks, settings);

  const acceptSuggestions = () => {
    form.setValue('cementUsed', Number(suggestion.cementKg.toFixed(2)));
    form.setValue('sandUsed', Number(suggestion.sandBuckets.toFixed(2)));
    form.setValue('dieselUsed', Number(suggestion.dieselLiters.toFixed(2)));
  };

  // Live batch calculation (preview)
  const getBatchResult = () => {
    const bricksProduced = form.watch('bricksProduced');
    const wastageCount = form.watch('wastageCount');
    const cementUsed = form.watch('cementUsed');
    const sandUsed = form.watch('sandUsed');
    const dieselUsed = form.watch('dieselUsed');

    return calcBatchResult({
      bricksProduced,
      wastageCount,
      cementUsed,
      sandUsed,
      dieselUsed,
      cementCostAtTime: settings.cementUnitCost,
      sandCostAtTime: settings.sandUnitCost,
      dieselCostAtTime: settings.dieselUnitCost,
      laborRateAtTime: settings.laborRate,
      salesPriceAtTime: settings.salesPricePerUnit,
      maintenanceReserveAtTime: settings.maintenanceReservePerUnit,
    });
  };

  const batchResult = getBatchResult();

  const onSubmit = async (data: ProductionFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await createProductionLog(data);
      alert("Production log created successfully!")
      if (result.success) {
        toast.success(
          `Production logged. Net yield: ${result.netYield} bricks.`
        );
        setOpen(false);
        form.reset();
      } else {
        alert("Failed to create production log: "  );
        toast.error(result.error || 'Failed to log production.');
      }
    } catch (err) {
      toast.error('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Production
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Production</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Worker selection (only for ADMIN) */}
            {currentUser.role === 'ADMIN' && (
              <FormField
                control={form.control}
                name="workerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Worker</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select worker" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {workers.map((w) => (
                          <SelectItem key={w.id} value={w.id}>
                            {w.name || w.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Bricks produced & wastage */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="bricksProduced"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bricks Produced</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="wastageCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wastage</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Material usage with suggestions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">
                  Materials Used (Base Units)
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={acceptSuggestions}
                >
                  Use suggested values
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Cement: {suggestion.cementKg.toFixed(2)} kg | Sand:{' '}
                {suggestion.sandBuckets.toFixed(2)} ပုံး | Diesel:{' '}
                {suggestion.dieselLiters.toFixed(2)} L
              </p>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="cementUsed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cement (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sandUsed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sand (ပုံး)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dieselUsed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diesel (litres)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Live cost preview */}
            {watchedBricks > 0 && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Net Yield</span>
                    <span>{batchResult.netYield}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wastage %</span>
                    <span>{batchResult.wastagePercent.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Cost</span>
                    <span>{batchResult.totalCost.toFixed(2)} ks</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost per Brick</span>
                    <span>{batchResult.costPerBrick.toFixed(2)} ks</span>
                  </div>
                  <Separator className="my-1" />
                  <div className="flex justify-between font-medium">
                    <span>Est. Revenue</span>
                    <span>{batchResult.estimatedRevenue.toFixed(2)} ks</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Est. Profit (gross)</span>
                    <span>{batchResult.estimatedProfit.toFixed(2)} ks</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <DialogTrigger asChild>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Confirm & Log Production'}
              </Button>
            </DialogTrigger>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
