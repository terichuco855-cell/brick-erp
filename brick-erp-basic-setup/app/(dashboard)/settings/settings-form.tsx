'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { updateGlobalSettings } from '@/lib/actions/settings';
import { calcCostPerBrick, calcProfitPerBrick } from '@/lib/utils/erp-logic'; // Adapt path to your project
import type { GlobalSettingsData } from '@/types';

// Zod schema matches all fields.
const settingsSchema = z.object({
  salesPricePerUnit: z.coerce.number().min(0, 'Must be ≥ 0'),
  maintenanceReservePerUnit: z.coerce.number().min(0),
  laborRate: z.coerce.number().min(0),
  cementUnitCost: z.coerce.number().min(0),
  sandUnitCost: z.coerce.number().min(0),
  dieselUnitCost: z.coerce.number().min(0),
  cementConversionFactor: z.coerce.number().positive('Must be > 0'),
  sandConversionFactor: z.coerce.number().positive(),
  dieselConversionFactor: z.coerce.number().positive(),
  cementRatio: z.coerce.number().min(0),
  sandRatio: z.coerce.number().min(0),
  dieselRatio: z.coerce.number().min(0),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface Props {
  settings: ReturnType<typeof serializeSettings>; // plain numbers
}

// Helper type for settings passed from server page (all numbers)
type SerializedSettings = {
  [K in keyof Omit<
    GlobalSettingsData,
    'id' | 'updatedAt' | 'updatedBy' | 'updatedById'
  >]: number;
};

export default function SettingsForm({ settings }: Props) {
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });

  // Watch all the fields for live preview.
  const watchedValues = form.watch();

  // Compute live previews using erp-logic helpers.
  const costPerBrick = calcCostPerBrick({
    cementRatio: watchedValues.cementRatio,
    sandRatio: watchedValues.sandRatio,
    dieselRatio: watchedValues.dieselRatio,
    cementUnitCost: watchedValues.cementUnitCost,
    sandUnitCost: watchedValues.sandUnitCost,
    dieselUnitCost: watchedValues.dieselUnitCost,
    laborRate: watchedValues.laborRate,
  });

  const profit = calcProfitPerBrick({
    salesPricePerUnit: watchedValues.salesPricePerUnit,
    maintenanceReservePerUnit: watchedValues.maintenanceReservePerUnit,
    cementRatio: watchedValues.cementRatio,
    sandRatio: watchedValues.sandRatio,
    dieselRatio: watchedValues.dieselRatio,
    cementUnitCost: watchedValues.cementUnitCost,
    sandUnitCost: watchedValues.sandUnitCost,
    dieselUnitCost: watchedValues.dieselUnitCost,
    laborRate: watchedValues.laborRate,
  });

  async function onSubmit(values: SettingsFormValues) {
    setIsSaving(true);
    try {
      const result = await updateGlobalSettings(values);
      if (!result.success) {
        toast.error(result.error || 'Failed to save.');
      } else if (!result.updated) {
        toast.message('No changes – settings are already up to date.');
      } else {
        toast.success('Settings updated successfully.');
      }
    } catch {
      toast.error('Network error – please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Global Settings</h1>
        <p className="text-muted-foreground">
          Pricing, conversion factors, and production ratios.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>
              Only administrators can modify these values.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                {/* Pricing Section */}
                <div>
                  <h3 className="text-sm font-semibold mb-4">Pricing (Kyat)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="salesPricePerUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sales Price per Brick</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="maintenanceReservePerUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maintenance Reserve per Brick</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Labour */}
                <div>
                  <h3 className="text-sm font-semibold mb-4">Labour</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="laborRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Labour Rate per Brick</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Raw Material Unit Costs (per BASE unit) */}
                <div>
                  <h3 className="text-sm font-semibold mb-4">
                    Raw Material Unit Costs (Base Units)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="cementUnitCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cement (ks/kg)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sandUnitCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sand (ks/ပုံး)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dieselUnitCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Diesel (ks/litre)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Conversion Factors */}
                <div>
                  <h3 className="text-sm font-semibold mb-4">
                    Conversion Factors (Purchase Unit → Base Unit)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="cementConversionFactor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>1 Bag (အိတ်) = ? kg</FormLabel>
                          <FormControl>
                            <Input type="number" step="any" {...field} />
                          </FormControl>
                          <FormDescription>Default: 50</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sandConversionFactor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>1 ကျင်း = ? ပုံး</FormLabel>
                          <FormControl>
                            <Input type="number" step="any" {...field} />
                          </FormControl>
                          <FormDescription>Default: 100</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dieselConversionFactor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>1 Gallon = ? litres</FormLabel>
                          <FormControl>
                            <Input type="number" step="any" {...field} />
                          </FormControl>
                          <FormDescription>Default: 3.785</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Production Ratios (consumption per brick) */}
                <div>
                  <h3 className="text-sm font-semibold mb-4">
                    Material Consumption per Brick (Base Units)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="cementRatio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cement (kg/brick)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.000001" {...field} />
                          </FormControl>
                          <FormDescription>Default: 0.02</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sandRatio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sand (ပုံး/brick)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.000001" {...field} />
                          </FormControl>
                          <FormDescription>Default: 0.001</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dieselRatio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Diesel (litres/brick)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.000001" {...field} />
                          </FormControl>
                          <FormDescription>Default: 0.005</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Saving…' : 'Save Settings'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Live Preview Card */}
        <Card className="lg:col-span-1 h-fit lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle className="text-base">Live Cost Preview</CardTitle>
            <CardDescription>Updated as you type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Cost / Brick</span>
              <span className="font-mono font-medium">
                {costPerBrick.totalCost.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                ks
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span>Revenue / Brick</span>
              <span className="font-mono">
                {profit.revenuePerBrick.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                ks
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Gross Profit</span>
              <span className="font-mono">
                {profit.grossProfit.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                ks
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Maintenance Reserve</span>
              <span className="font-mono">
                {profit.maintenanceReserve.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                ks
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm font-semibold">
              <span>Net Profit</span>
              <span className="font-mono text-brand-clay-500">
                {profit.netProfit.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                ks
              </span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Margin</span>
              <span>{profit.marginPercent.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
