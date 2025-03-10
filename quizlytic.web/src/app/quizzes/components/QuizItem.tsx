import { Quiz } from "@/lib/types";
import DateDisplay from "@/components/DateDisplay";
import { getStatusBadgeClasses, getStatusLabel } from "../utils/statusUtils";

interface QuizItemProps {
  quiz: Quiz;
  onClick: (id: number) => void;
}

export default function QuizItem({ quiz, onClick }: QuizItemProps) {
  return (
    <div
      onClick={() => onClick(quiz.id)}
      className="border border-border rounded-md p-4 hover:bg-accent cursor-pointer transition"
    >
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-foreground">{quiz.title}</h3>
        <span
          className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClasses(
            quiz.status
          )}`}
        >
          {getStatusLabel(quiz.status)}
        </span>
      </div>
      <p className="text-text-secondary mt-1">
        {quiz.questionsCount} questions
      </p>
      <div className="flex justify-between text-xs text-text-secondary mt-2">
        <span>
          Created <DateDisplay date={quiz.createdAt} formatString="PPp" />
        </span>
        {quiz.startedAt && (
          <span>
            Started <DateDisplay date={quiz.startedAt} formatString="PPp" />
          </span>
        )}
      </div>
    </div>
  );
}
