import { Quiz } from "@/lib/types";
import DateDisplay from "@/components/DateDisplay";
import Link from "next/link";

interface QuizCardProps {
  quiz: Quiz;
  onClick: (id: number) => void;
  showStatus?: boolean;
}

export default function QuizCard({
  quiz,
  onClick,
  showStatus = true,
}: QuizCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(quiz.id);
    }
  };
  return (
    <Link href={`/quiz/${quiz.publicId}`}>
      <div
        onClick={handleClick}
        className="border border-border rounded-md p-4 hover:bg-accent cursor-pointer transition"
      >
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-foreground">{quiz.title}</h3>
          {showStatus && (
            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
              Active
            </span>
          )}
        </div>
        <p className="text-text-secondary mt-1">
          {quiz.questionsCount} questions
        </p>
        <p className="text-xs text-text-secondary mt-2">
          Created <DateDisplay date={quiz.createdAt} formatString="PPp" />
        </p>
      </div>
    </Link>
  );
}
