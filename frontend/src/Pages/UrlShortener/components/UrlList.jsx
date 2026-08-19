import { useState } from "react";

import UrlRow from "./UrlRow";
import CopyButton from "./CopyButton";
import ExpirationPicker from "./ExpirationPicker";
import QRCodeButton from "./QRCodeButton";
import SaveButton from "./SaveButton";
import AddNewButton from "./AddNewButton";
import AddNewMenu from "./AddNewMenu";
import QRModal from "./QRModal";

const createRow = () => ({
  id: Date.now() + Math.random(),
  expiration: "",
  shortUrl: "https://form.formhub.com/to/INYXidiE",
});

const UrlList = () => {
  const [rows, setRows] = useState([createRow()]);
  const [showMenu, setShowMenu] = useState(false);

  const [qrOpen, setQrOpen] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState("");

  const addUrlRow = () => {
    setRows((prev) => [...prev, createRow()]);
    setShowMenu(false);
  };

  const handleFileGenerator = () => {
    console.log("File Generator");
    setShowMenu(false);
  };

  const openQR = (url) => {
    setSelectedUrl(url);
    setQrOpen(true);
  };

  return (
    <div className="relative">
      {/* URL Rows */}

      <div className="space-y-6">
        {rows.map((row) => (
          <div
            key={row.id}
            className="flex items-center gap-3"
          >
            <UrlRow
              row={row}
              onShorten={(url) => {
                console.log("Shorten:", url);

                // Backend:
                // const short = await shortenUrl(url)
                // update row.shortUrl
              }}
            />

            <CopyButton
              onClick={() => {
                navigator.clipboard.writeText(row.shortUrl);
              }}
            />

            <ExpirationPicker
              value={row.expiration}
              onChange={(value) =>
                setRows((prev) =>
                  prev.map((r) =>
                    r.id === row.id
                      ? {
                          ...r,
                          expiration: value,
                        }
                      : r
                  )
                )
              }
            />

            <QRCodeButton
              onClick={() => openQR(row.shortUrl)}
            />

            <SaveButton
              onClick={() => {
                console.log("Save Row", row);

                // Backend:
                // await saveRow(row)
              }}
            />
          </div>
        ))}
      </div>

      {/* Add New */}

      <div className="relative mt-6 inline-block">
        <AddNewButton
          onClick={() => setShowMenu((prev) => !prev)}
        />

        <div className="absolute left-0 top-12 z-40">
          <AddNewMenu
            open={showMenu}
            onCreateUrl={addUrlRow}
            onCreateFile={handleFileGenerator}
          />
        </div>
      </div>

      {/* QR Modal */}

      <QRModal
        open={qrOpen}
        url={selectedUrl}
        onClose={() => setQrOpen(false)}
      />
    </div>
  );
};

export default UrlList;