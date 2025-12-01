"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, FileText, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Dummy data
const dummyOrganizations = [
  { id: "org-1", name: "Vantaverse Clinic" },
  { id: "org-2", name: "Sports Medicine Center" },
  { id: "org-3", name: "Rehabilitation Institute" },
  { id: "org-4", name: "Wellness Center" },
];

const dummyTeams = [
  { id: "team-1", name: "Orthopedic Team" },
  { id: "team-2", name: "Sports Medicine Team" },
  { id: "team-3", name: "Pediatric Team" },
  { id: "team-4", name: "Geriatric Team" },
];

const dummyUsers = [
  { id: "user-1", name: "John Doe" },
  { id: "user-2", name: "Jane Smith" },
  { id: "user-3", name: "Mike Johnson" },
  { id: "user-4", name: "Sarah Williams" },
];

export default function ReportsPage() {
  const [reportType, setReportType] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleReportTypeChange = (value: string) => {
    setReportType(value);
    setSelectedItem(""); // Reset selected item when scope changes
  };

  const getDummyData = () => {
    switch (reportType) {
      case "organization":
        return dummyOrganizations;
      case "team":
        return dummyTeams;
      case "user":
        return dummyUsers;
      default:
        return [];
    }
  };

  const getLabel = () => {
    switch (reportType) {
      case "organization":
        return "Select Organization";
      case "team":
        return "Select Team";
      case "user":
        return "Select User";
      default:
        return "";
    }
  };

  const handleDownloadCSV = () => {
    // Dummy function - no actual functionality
    console.log("Download CSV clicked");
  };

  const handleDownloadPDF = () => {
    // Dummy function - no actual functionality
    console.log("Download PDF clicked");
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Reports & Data</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>Select report scope and date range to generate your report</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="report-type">Report Scope</Label>
                <Select value={reportType} onValueChange={handleReportTypeChange}>
                  <SelectTrigger id="report-type" className="w-full">
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organization">Organization</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date Range</Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={{
                        from: dateRange.from,
                        to: dateRange.to,
                      }}
                      onSelect={(range) => {
                        setDateRange({
                          from: range?.from,
                          to: range?.to,
                        });
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <AnimatePresence>
              {reportType && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 md:w-1/2">
                    <Label htmlFor="scope-item">{getLabel()}</Label>
                    <Select value={selectedItem} onValueChange={setSelectedItem}>
                      <SelectTrigger id="scope-item" className="w-full">
                        <SelectValue placeholder={getLabel()} />
                      </SelectTrigger>
                      <SelectContent>
                        {getDummyData().map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleDownloadCSV}
              variant="outline"
              className="flex-1"
              disabled={!reportType || !selectedItem || !dateRange.from}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Download CSV
            </Button>
            <Button
              onClick={handleDownloadPDF}
              variant="outline"
              className="flex-1"
              disabled={!reportType || !selectedItem || !dateRange.from}
            >
              <FileText className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

