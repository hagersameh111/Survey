import { useCallback, useEffect, useState } from "react";
import { getFolders, getResponseStats } from "../api/forms";
import { FALLBACK_FOLDERS } from "../config/folders";

export default function useFolders() {
  const [folders, setFolders] = useState(FALLBACK_FOLDERS);
  const [stats, setStats] = useState({ collected: 0, limit: 100 });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    getFolders(ctrl.signal)
      .then((f) => f.length && setFolders(f))
      .catch(() => {});
    getResponseStats(ctrl.signal)
      .then((s) => s && setStats({ collected: s.collected ?? 0, limit: s.limit ?? 100 }))
      .catch(() => {});
    return () => ctrl.abort();
  }, [tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);
  return { folders, stats, refresh };
}