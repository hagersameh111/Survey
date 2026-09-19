const QuestionTypeCard = ({ icon: Icon, title, color, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`${color} flex h-24 flex-col items-center justify-center gap-2 rounded-xl border border-transparent transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-sm`}
    >
      <Icon size={20} className="text-primary" />
      <span className="text-sm font-medium text-text">
        {title}
      </span>
    </button>
  );
};

export default QuestionTypeCard;