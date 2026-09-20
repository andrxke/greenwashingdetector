"use client";

import { Tabs, type TabItem } from "@/components/ui/Tabs";
import type { InputMode } from "@/lib/types";
import { Building2, FileText, Link2, Type } from "lucide-react";

interface InputTabsProps {
  activeMode: InputMode;
  onChange: (mode: InputMode) => void;
}

const TAB_ITEMS: TabItem<InputMode>[] = [
  { id: "url", label: "URL Input", icon: <Link2 className="h-4 w-4" /> },
  { id: "company", label: "Company Search", icon: <Building2 className="h-4 w-4" /> },
  { id: "pdf", label: "PDF Upload", icon: <FileText className="h-4 w-4" /> },
  { id: "text", label: "Paste Text", icon: <Type className="h-4 w-4" /> }
];

export function InputTabs({ activeMode, onChange }: InputTabsProps) {
  return <Tabs items={TAB_ITEMS} activeId={activeMode} onChange={onChange} />;
}
