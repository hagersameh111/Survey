const ResponsesProgress = ({ collected, limit }) => {
  const progress = limit > 0 ? Math.min(100, (collected / limit) * 100) : 0;

  return (
    <div className="border-t border-divider p-5">
      <h3 className="mb-3 text-sm text-text">Responses collected</h3>

      <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-sm">
        <span className="font-medium text-primary">{collected}</span>
        <span className="text-text-muted"> / {limit}</span>
      </p>
    </div>
  );
};

export default ResponsesProgress;