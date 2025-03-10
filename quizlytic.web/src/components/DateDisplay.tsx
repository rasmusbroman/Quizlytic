"use client";

import { format, parseISO } from "date-fns";
import { useState, useEffect } from "react";

interface DateDisplayProps {
  date: string | Date | null;
  formatString?: string;
}

export default function DateDisplay({
  date,
  formatString = "yyyy-MM-dd",
}: DateDisplayProps) {
  const [formattedDate, setFormattedDate] = useState<string>("");

  useEffect(() => {
    if (!date) return;

    try {
      const dateObj = typeof date === "string" ? parseISO(date) : date;
      setFormattedDate(format(dateObj, formatString));
    } catch (error) {
      console.error("Invalid date format:", error);
      setFormattedDate("Invalid date");
    }
  }, [date, formatString]);

  if (!formattedDate) {
    return <span className="opacity-0">...</span>;
  }

  return <span>{formattedDate}</span>;
}
