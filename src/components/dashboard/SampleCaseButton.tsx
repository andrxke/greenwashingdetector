"use client";

import { Button } from "@/components/ui/Button";
import { FlaskConical } from "lucide-react";

interface SampleCaseButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function SampleCaseButton({ onClick, disabled }: SampleCaseButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      icon={<FlaskConical className="h-4 w-4" />}
      onClick={onClick}
      disabled={disabled}
    >
      Load Sample Bad ESG Report
    </Button>
  );
}
