import React from "react";
import { AliScriptEditor } from "../../../../../../components/editor/AliScriptEditor";

interface CampaignScriptEditorProps {
  value: string;
  onChange: (value: string) => void;
  isMobile: boolean;
  onRun?: () => void;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
}

export function CampaignScriptEditor({
  value,
  onChange,
  isMobile,
  onRun,
  readOnly,
  placeholder,
  className,
}: CampaignScriptEditorProps) {
  return (
    <AliScriptEditor
      value={value}
      onChange={onChange}
      isMobile={isMobile}
      onRun={onRun}
      readOnly={readOnly}
      placeholder={placeholder}
      className={className}
    />
  );
}
