import { QrCode } from "lucide-react";

const QRCodeButton = ({
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-surface transition hover:bg-background"
    >
      <QrCode
        size={20}
        className="text-text-secondary"
      />
    </button>
  );
};

export default QRCodeButton;