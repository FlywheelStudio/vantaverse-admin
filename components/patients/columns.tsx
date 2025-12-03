"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Patient } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { MessageSquare } from "lucide-react";

export function createColumns(onMessageClick?: (patient: Patient) => void): ColumnDef<Patient>[] {
  return [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "firstName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Patient
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const patient = row.original;
      return (
        <div className="flex items-center gap-x-3">
          <Avatar>
            <AvatarImage src={patient.avatarUrl} />
            <AvatarFallback>{patient.firstName[0]}{patient.lastName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{patient.firstName} {patient.lastName}</span>
            <span className="text-xs text-muted-foreground">{patient.email}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "program.name",
    header: "Program",
    cell: ({ row }) => {
      const program = row.original.program;
      if (!program) return <span className="text-muted-foreground">No program</span>;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{program.name}</span>
          <span className="text-xs text-muted-foreground">Week {program.currentWeek} of {program.totalWeeks}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "compliancePercent",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Compliance
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const compliance = parseFloat(row.getValue("compliancePercent"));
      let color = "bg-green-500";
      if (compliance < 60) color = "bg-red-500";
      else if (compliance < 80) color = "bg-yellow-500";

      return (
        <div className="flex items-center gap-x-2">
          <div className="w-[60px] bg-secondary h-2 rounded-full">
            <div
              className={`h-2 rounded-full ${color}`}
              style={{ width: `${compliance}%` }}
            />
          </div>
          <span className="text-sm font-medium">{compliance}%</span>
        </div>
      );
    },
  },
  {
    accessorKey: "lastActivity",
    header: "Last Activity",
    cell: ({ row }) => {
      return format(row.getValue("lastActivity"), "MMM d, yyyy");
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant={
            status === "on-track"
              ? "default" // using default for success-like look if customized, or outline
              : status === "needs-attention"
              ? "destructive"
              : "secondary"
          }
          className={
             status === "on-track" ? "bg-green-600 hover:bg-green-700" : ""
          }
        >
          {status.replace("-", " ")}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const patient = row.original;

      return (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(patient.id);
                }}
              >
                Copy patient ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                  <Link href={`/patients/${patient.id}`} onClick={(e) => e.stopPropagation()}>View details</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>View program</DropdownMenuItem>
              {onMessageClick && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      onMessageClick(patient);
                    }}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Message
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
  ];
}
