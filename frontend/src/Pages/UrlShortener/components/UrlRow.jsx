import RowLayout from "./RowLayout";
import UrlInput from "./UrlInput";

const UrlRow = ({ row, onChange, onSwap, onShorten, onQr, onSave, busy }) => (
  <RowLayout
    row={row}
    onChange={onChange}
    onSwap={onSwap}
    onQr={onQr}
    onSave={onSave}
    source={<UrlInput value={row.longUrl} onChange={(longUrl) => onChange({ longUrl })} />}
    actionLabel="Shorten URL"
    actionDisabled={!row.longUrl.trim()}
    onAction={onShorten}
    busy={busy}
  />
);

export default UrlRow;
