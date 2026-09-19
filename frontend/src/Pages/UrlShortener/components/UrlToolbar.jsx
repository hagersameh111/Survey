import SearchBar from "./SearchBar";
import FilterButton from "./FilterButton";
import SortDropdown from "./SortDropdown";

const UrlToolbar = ({
  search,
  setSearch,
  sortBy,
  setSortBy,
}) => {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">

        <h1 className="text-5xl font-semibold text-text">
          URLs Shortener
        </h1>

        <div className="flex items-center gap-4">

          <FilterButton />

          <SearchBar
            value={search}
            onChange={setSearch}
          />

          <SortDropdown
            value={sortBy}
            onChange={setSortBy}
          />

        </div>

      </div>

      <div className="border-b border-border" />
    </>
  );
};

export default UrlToolbar;