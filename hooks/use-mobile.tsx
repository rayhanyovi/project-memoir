import { useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 768px)";

const getIsMobile = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(MOBILE_QUERY).matches;
};

export default function useIsMobile() {
  const [isMobile, setIsMobile] = useState(getIsMobile);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(MOBILE_QUERY);
    const handleChange = (event: MediaQueryListEvent) =>
      setIsMobile(event.matches);

    // Sync the value on mount and subscribe for resize changes.
    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isMobile;
}
