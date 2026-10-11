import { QrCode } from "lucide-react";

const QRCodeButton = ({ onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label="Show QR code"
    className={`flex h-12 w-10 shrink-0 items-center justify-center rounded-xl bg-background transition ${
      disabled ? "cursor-not-allowed text-text-muted/60" : "text-text hover:bg-primary-light hover:text-primary"
    }`}
  >
    <QrCode size={20} />
  </button>
);

export default QRCodeButton;