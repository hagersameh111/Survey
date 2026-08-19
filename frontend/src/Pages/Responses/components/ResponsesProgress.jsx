const ResponsesProgress = ({
  collected,
  limit,
}) => {
  const progress =
    limit > 0
      ? (collected / limit) * 100
      : 0;

  return (
    <div className="border-t border-border p-5">

      <h3 className="mb-4 font-medium text-text">
        Responses collected
      </h3>

      <div className="mb-3 h-1.5 rounded-full bg-border">

        <div
          className="h-full rounded-full bg-primary"
          style={{
            width: `${progress}%`,
          }}
        />

      </div>

      <p>

        <span className="font-semibold text-primary">
          {collected}
        </span>

        <span className="text-text-muted">
          {" "}
          / {limit}
        </span>

      </p>

    </div>
  );
};

export default ResponsesProgress;