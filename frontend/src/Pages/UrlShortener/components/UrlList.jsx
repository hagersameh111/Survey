import { useState } from "react";
import UrlRow from "./UrlRow";
import CopyButton from "./CopyButton";
import ExpirationPicker from "./ExpirationPicker";
import QRCodeButton from "./QRCodeButton";
import SaveButton from "./SaveButton";
import AddNewButton from "./AddNewButton";
import AddNewMenu from "./AddNewMenu";
import QRModal from "./QRModal";
import FileGeneratorList from "./FileGeneratorList";

const createRow = () => ({
  id: Date.now() + Math.random(),
  expiration: "",
  shortUrl: "https://form.formhub.com/to/INYXidiE",
});

const UrlList = () => {
  const [rows, setRows] = useState([createRow()]);
  const [showMenu, setShowMenu] = useState(false);
  
  // State to track whether we are viewing URLs or the File Link Generator
  const [activeView, setActiveView] = useState("urls"); // 'urls' or 'files'

  const [qrOpen, setQrOpen] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState("");

  const addUrlRow = () => {
    setActiveView("urls"); // switch back to URL list if adding a URL row
    setRows((prev) => [...prev, createRow()]);
    setShowMenu(false);
  };

  const handleFileGenerator = () => {
    setActiveView("files"); // switch view to File Generator list
    setShowMenu(false);
  };

  const openQR = (url) => {
    setSelectedUrl(url);
    setQrOpen(true);
  };

  return (
    <div className="relative">
      
      {/* Conditionally render URL Rows list or File Generator view */}
      {activeView === "urls" ? (
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
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <FileGeneratorList />
      )}

      {/* Add New Section */}
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