'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, ChevronDown } from 'lucide-react';

interface ExerciseSearchControlsProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortChange: (by: string, order: 'asc' | 'desc') => void;
}

export function ExerciseSearchControls({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
}: ExerciseSearchControlsProps) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search exercises..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            Sort by: {sortBy === 'updated_at' ? 'Updated' : 'Name'}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => {
              onSortChange('updated_at', 'desc');
            }}
          >
            Updated (Most Recent)
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              onSortChange('updated_at', 'asc');
            }}
          >
            Updated (Oldest)
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              onSortChange('exercise_name', 'asc');
            }}
          >
            Name (A-Z)
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              onSortChange('exercise_name', 'desc');
            }}
          >
            Name (Z-A)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
