import { useCallback, useEffect, useState } from "react";
import { getForms } from "../api/forms";

export default function useForms({ folder, sort, order }) {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    getForms({ folder, sort, order }, ctrl.signal)
      .then((f) => !ctrl.signal.aborted && setForms(f))
      .catch((e) => {
        if (ctrl.signal.aborted) return; // cancelled by navigation, not a real error
        setError(e.response?.data?.message || e.message || "Something went wrong");
      })
      .finally(() => !ctrl.signal.aborted && setLoading(false));
    return () => ctrl.abort();
  }, [folder, sort, order, tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);
  return { forms, loading, error, refetch };
}