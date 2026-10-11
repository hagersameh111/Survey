const ResponseAvatar = ({ avatar, name }) => (
  <div className="flex min-w-0 items-center gap-3">
    {avatar ? (
      <img src={avatar} alt="" className="h-8 w-8 shrink-0 rounded-lg object-cover" />
    ) : (
      <div className="h-8 w-8 shrink-0 rounded-lg bg-primary" aria-hidden="true" />
    )}
    <span className="truncate text-text">{name}</span>
  </div>
);

export default ResponseAvatar;