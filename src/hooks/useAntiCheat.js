import { useEffect, useRef } from "react";
import { logActivity } from "../controllers/ExamController";

export default function useAntiCheat(kode_soal, violationsRef) {
  const warnedOnce = useRef(false);

  useEffect(() => {
    if (!kode_soal) return;

    // Right-click block
    const handleContext = (e) => {
      e.preventDefault();
      violationsRef.current++;
    };

    // Keyboard shortcuts block
    const handleKey = (e) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "i" || e.key === "j" || e.key === "I" || e.key === "J")) ||
        (e.ctrlKey && e.key === "u") ||
        (e.ctrlKey && e.key === "c") ||
        (e.ctrlKey && e.key === "v")
      ) {
        e.preventDefault();
        violationsRef.current++;
      }
    };

    // Copy/Paste block
    const handleCopy = (e) => { e.preventDefault(); violationsRef.current++; };
    const handlePaste = (e) => { e.preventDefault(); violationsRef.current++; };

    // Visibility change detection
    let lastHiddenTime = 0;
    const handleVisibility = () => {
      if (document.hidden) {
        lastHiddenTime = Date.now();
        violationsRef.current++;
        if (!warnedOnce.current) {
          warnedOnce.current = true;
        }
      } else {
        const hiddenDuration = Math.round((Date.now() - lastHiddenTime) / 1000);
        if (hiddenDuration > 2 && lastHiddenTime > 0) {
          logActivity(kode_soal, "pindah_tab", { duration: hiddenDuration, timestamp: new Date().toISOString() });
        }
        lastHiddenTime = 0;
      }
    };

    // Before unload
    const handleBeforeUnload = (e) => {
      logActivity(kode_soal, "tutup_halaman", { timestamp: new Date().toISOString() });
      e.preventDefault();
      e.returnValue = "";
    };

    document.addEventListener("contextmenu", handleContext);
    document.addEventListener("keydown", handleKey);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("contextmenu", handleContext);
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [kode_soal, violationsRef]);
}
