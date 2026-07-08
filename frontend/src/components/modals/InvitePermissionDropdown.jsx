import { useEffect, useRef, useState } from "react";
import { UserRoundPlus, ChevronDown } from "lucide-react";

const permissions = [
  "Can View Only",
  "Can Edit",
  "Can Add",
  "Can Delete",
];

const InvitePermissionDropdown = ({
  value,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  return (
    <div
      className="relative"
      ref={dropdownRef}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-12 w-full items-center justify-between rounded-xl border border-border bg-white px-4 transition hover:border-primary"
      >
        <div className="flex items-center gap-3">
          <UserRoundPlus
            size={18}
            className="text-text-secondary"
          />

          <span>{value}</span>
        </div>

        <ChevronDown
          size={18}
          className={`transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[110%] z-50 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
          {permissions.map((permission) => (
            <button
              key={permission}
              type="button"
              onClick={() => {
                onChange(permission);
                setOpen(false);
              }}
              className="flex w-full items-center border-b border-border px-5 py-4 text-left transition last:border-b-0 hover:bg-background"
            >
              {permission}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvitePermissionDropdown;