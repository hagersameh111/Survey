import { useState } from "react";
import UrlShortenerHeader from "./components/UrlShortenerHeader";
import UrlList from "./components/UrlList";

const UrlShortener = () => {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");

  return (
    <div className="min-w-0 rounded-2xl bg-surface p-4 shadow-sm sm:p-6 lg:p-8">
      <UrlShortenerHeader
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
      />
      <div className="mt-5 h-px bg-divider" />
      <div className="mt-6">
        <UrlList search={search} sort={sort} />
      </div>
    </div>
  );
};

export default UrlShortener;
