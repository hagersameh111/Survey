import { useState } from "react";
import { ArrowRight, Link2 } from "lucide-react";

import UrlInput from "./UrlInput";
import ShortUrlInput from "./ShortUrlInput";
import ActiveToggle from "./ActiveToggle";

const UrlRow = ({
  onShorten,
}) => {
  const [longUrl, setLongUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [active, setActive] = useState(true);

  return (
    <div className="flex items-center gap-4">

      {/* Long URL */}

      <UrlInput
        value={longUrl}
        onChange={setLongUrl}
      />

      {/* Shorten */}

      <button
        onClick={() => onShorten(longUrl)}
        className="flex h-14 items-center gap-2 rounded-xl bg-primary px-6 font-medium text-white transition hover:bg-primary-hover"
      >
        <Link2 size={18} />

        Shorten URL
      </button>

      {/* Arrow */}

      <ArrowRight
        size={22}
        className="text-text-muted"
      />

      {/* Active */}

      <ActiveToggle
        checked={active}
        onChange={setActive}
      />

      {/* Short URL */}

      <div className="w-96">
        <ShortUrlInput
          value={shortUrl}
          onChange={setShortUrl}
        />
      </div>

    </div>
  );
};

export default UrlRow;