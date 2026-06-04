"use client";

import { useState } from "react";
import { ConsentModal } from "./ConsentModal";

interface Props {
  needsConsent: boolean;
  children: React.ReactNode;
}

export function ConsentGate({ needsConsent, children }: Props) {
  const [consented, setConsented] = useState(!needsConsent);

  return (
    <>
      {!consented && <ConsentModal onConsented={() => setConsented(true)} />}
      {children}
    </>
  );
}
