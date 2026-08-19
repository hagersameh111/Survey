const ResponseAvatar = ({
  avatar,
  name,
}) => {
  return (
    <div className="flex items-center gap-3">
      <img
        src={avatar}
        alt={name}
        className="h-11 w-11 rounded-xl object-cover"
      />

      <span className="font-medium text-text">
        {name}
      </span>
    </div>
  );
};

export default ResponseAvatar;