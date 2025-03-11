import { QuizStatus } from "@/lib/types";

export const getStatusBadgeClasses = (status: QuizStatus): string => {
  switch (status) {
    case QuizStatus.Active:
      return "bg-green-100 text-green-800";
    case QuizStatus.Paused:
      return "bg-yellow-100 text-yellow-800";
    case QuizStatus.Created:
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getStatusLabel = (status: QuizStatus): string => {
  switch (status) {
    case QuizStatus.Active:
      return "Active";
    case QuizStatus.Paused:
      return "Paused";
    case QuizStatus.Created:
      return "Draft";
    default:
      return "Unknown";
  }
};
