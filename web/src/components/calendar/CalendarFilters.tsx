"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Filter, Calendar } from 'lucide-react';
import { CalendarFilters as CalendarFiltersType } from '@/types/calendar';

interface CalendarFiltersProps {
  filters: CalendarFiltersType;
  onFiltersChange: (filters: Partial<CalendarFiltersType>) => void;
  onClose: () => void;
}

export function CalendarFilters({
  filters,
  onFiltersChange,
  onClose,
}: CalendarFiltersProps) {
  const platforms = [
    { id: 'twitter', name: 'Twitter', icon: '𝕏' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
    { id: 'instagram', name: 'Instagram', icon: '📷' },
  ];

  const statuses = [
    { id: 'draft', name: 'Draft', color: 'bg-gray-100 text-gray-800' },
    { id: 'scheduled', name: 'Scheduled', color: 'bg-blue-100 text-blue-800' },
    { id: 'published', name: 'Published', color: 'bg-green-100 text-green-800' },
    { id: 'failed', name: 'Failed', color: 'bg-red-100 text-red-800' },
  ];

  const handlePlatformChange = (platform: string, checked: boolean) => {
    const newPlatforms = checked
      ? [...filters.platforms, platform as any]
      : filters.platforms.filter(p => p !== platform);
    
    onFiltersChange({ platforms: newPlatforms });
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    const newStatuses = checked
      ? [...filters.status, status as any]
      : filters.status.filter(s => s !== status);
    
    onFiltersChange({ status: newStatuses });
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    onFiltersChange({
      dateRange: {
        ...filters.dateRange,
        [field]: value,
      },
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      platforms: ['twitter', 'linkedin', 'instagram'],
      status: ['draft', 'scheduled', 'published', 'failed'],
      dateRange: { start: '', end: '' },
      showOptimalTimes: true,
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    
    if (filters.platforms.length < 3) count++;
    if (filters.status.length < 4) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (!filters.showOptimalTimes) count++;
    
    return count;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary">
                {getActiveFiltersCount()} active
              </Badge>
            )}
          </CardTitle>
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Platforms */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Platforms</h4>
          <div className="grid grid-cols-3 gap-3">
            {platforms.map((platform) => (
              <div key={platform.id} className="flex items-center space-x-2">
                <Checkbox
                  id={platform.id}
                  checked={filters.platforms.includes(platform.id as any)}
                  onCheckedChange={(checked) => 
                    handlePlatformChange(platform.id, checked as boolean)
                  }
                />
                <label
                  htmlFor={platform.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
                >
                  <span>{platform.icon}</span>
                  {platform.name}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Status</h4>
          <div className="grid grid-cols-2 gap-3">
            {statuses.map((status) => (
              <div key={status.id} className="flex items-center space-x-2">
                <Checkbox
                  id={status.id}
                  checked={filters.status.includes(status.id as any)}
                  onCheckedChange={(checked) => 
                    handleStatusChange(status.id, checked as boolean)
                  }
                />
                <label
                  htmlFor={status.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  <Badge className={status.color}>
                    {status.name}
                  </Badge>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Date Range
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">From</label>
              <Input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">To</label>
              <Input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Show Optimal Times */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Display Options</h4>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showOptimalTimes"
              checked={filters.showOptimalTimes}
              onCheckedChange={(checked) => 
                onFiltersChange({ showOptimalTimes: checked as boolean })
              }
            />
            <label
              htmlFor="showOptimalTimes"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Show optimal posting times
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={clearFilters} variant="outline" className="flex-1">
            Clear All
          </Button>
          <Button onClick={onClose} className="flex-1">
            Apply Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
