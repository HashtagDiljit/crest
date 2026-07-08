"use client";

import { createContext, useContext, useState, useRef, useCallback } from "react";

interface KeypadConfig {
  value: string;
  isInt: boolean;
  onChange: (v: string) => void;
  onDone?: () => void;
}

interface NumericKeypadContextType {
  openKeypad: (config: KeypadConfig) => void;
  closeKeypad: () => void;
  isOpen: boolean;
}

const NumericKeypadContext = createContext<NumericKeypadContextType>({
  openKeypad: () => {},
  closeKeypad: () => {},
  isOpen: false,
});

export function useNumericKeypad() {
  return useContext(NumericKeypadContext);
}

export function NumericKeypadProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<KeypadConfig | null>(null);
  const [currentVal, setCurrentVal] = useState("0");
  const configRef = useRef<KeypadConfig | null>(null);

  const openKeypad = useCallback((cfg: KeypadConfig) => {
    configRef.current = cfg;
    setConfig(cfg);
    setCurrentVal(cfg.value);
  }, []);

  const closeKeypad = useCallback(() => {
    configRef.current?.onDone?.();
    configRef.current = null;
    setConfig(null);
  }, []);

  function handleKey(key: string) {
    setCurrentVal(prev => {
      let next: string;
      if (key === "⌫") {
        next = prev.length > 1 ? prev.slice(0, -1) : "0";
      } else if (key === ".") {
        next = prev.includes(".") ? prev : prev + ".";
      } else {
        // Don't prepend to leading zero (unless it's "0." prefix)
        next = prev === "0" ? key : prev + key;
      }
      configRef.current?.onChange(next);
      return next;
    });
  }

  const rows = [
    ["7", "8", "9"],
    ["4", "5", "6"],
    ["1", "2", "3"],
    [config?.isInt ? "" : ".", "0", "⌫"],
  ];

  return (
    <NumericKeypadContext.Provider value={{ openKeypad, closeKeypad, isOpen: !!config }}>
      {children}
      {config && (
        <>
          {/* Backdrop — tap to dismiss */}
          <div className="fixed inset-0 z-[8998]" onClick={closeKeypad} />
          {/* Keypad panel */}
          <div
            className="fixed bottom-0 left-0 right-0 z-[8999]"
            style={{ background: "var(--color-bg-surface)", borderTop: "1px solid var(--color-border)", boxShadow: "0 -12px 40px rgba(0,0,0,0.5)" }}
          >
            {/* Value display + Done */}
            <div
              className="flex items-center justify-between px-5 py-2.5 border-b"
              style={{ borderColor: "var(--color-border)" }}
            >
              <span className="font-mono text-22 font-semibold text-text-primary min-w-[80px]">{currentVal}</span>
              <button
                onClick={closeKeypad}
                className="px-5 py-2 rounded-r3 font-semibold text-14 text-white transition-colors"
                style={{ background: "var(--color-accent)" }}
              >
                Done
              </button>
            </div>
            {/* Key grid */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: "repeat(3, 1fr)",
                paddingBottom: "env(safe-area-inset-bottom, 0px)",
              }}
            >
              {rows.map((row, ri) =>
                row.map((key, ci) => {
                  if (key === "") {
                    // Blank placeholder for integer mode
                    return (
                      <div
                        key={`${ri}-${ci}`}
                        style={{ height: 60, borderTop: "1px solid var(--color-border)", borderRight: ci < 2 ? "1px solid var(--color-border)" : undefined, background: "var(--color-bg-elevated)" }}
                      />
                    );
                  }
                  const isBackspace = key === "⌫";
                  return (
                    <button
                      key={`${ri}-${ci}`}
                      onClick={() => handleKey(key)}
                      className="flex items-center justify-center font-medium text-text-primary active:bg-bg-elevated select-none transition-colors"
                      style={{
                        height: 60,
                        fontSize: isBackspace ? 20 : 24,
                        borderTop: "1px solid var(--color-border)",
                        borderRight: ci < 2 ? "1px solid var(--color-border)" : undefined,
                        background: isBackspace ? "var(--color-bg-elevated)" : "var(--color-bg-surface)",
                        touchAction: "manipulation",
                      }}
                    >
                      {key}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </NumericKeypadContext.Provider>
  );
}
