import QuestionItem from "./QuestionItem";

const QuestionList = ({
  questions,
  onDeleteQuestion,
}) => {
  return (
    <div className="rounded-3xl bg-white p-3 shadow-sm">

      <div className="space-y-3">

        {questions.map((question) => (
          <QuestionItem
            key={question.id}
            question={question}
            onDelete={onDeleteQuestion}
          />
        ))}

      </div>

      <div className="mt-5 flex justify-center">

        <div className="h-1.5 w-20 rounded-full bg-gray-400" />

      </div>

    </div>
  );
};

export default QuestionList;