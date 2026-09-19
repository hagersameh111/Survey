import { useState } from "react";
import UrlToolbar from "./components/UrlToolbar";
import UrlList from "./components/UrlList";

const UrlShortener = () => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  return (
    <main>
      <UrlToolbar
        search={search}
        setSearch={setSearch}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />
      <div className="mt-8">
        <UrlList />
      </div>
    </main>
  );
};

export default UrlShortener;