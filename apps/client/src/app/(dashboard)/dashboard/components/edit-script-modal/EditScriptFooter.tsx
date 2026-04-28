import React from "react";

export type FooterStatus = "idle" | "success" | "error";

interface EditScriptFooterProps {
    status: FooterStatus;
    formattedDate: string;
    onClose: () => void;
    onSave: () => void;
}

export function EditScriptFooter({ status, formattedDate, onClose, onSave }: EditScriptFooterProps) {
    return (
        <div className="em-footer">
            <div className="em-footer-left">
                {status === "idle" && (
                    <span className="em-meta">LAST MODIFIED: {formattedDate}</span>
                )}
                {status === "success" && (
                    <span className="em-feedback em-feedback--ok">✓ SCRIPT UPDATED</span>
                )}
                {status === "error" && (
                    <span className="em-feedback em-feedback--err">✗ SAVE FAILED</span>
                )}
            </div>
            <div className="em-footer-right">
                <button onClick={onClose} className="em-btn em-btn-cancel">CANCEL</button>
                <button onClick={onSave} className="em-btn em-btn-save">SAVE CHANGES</button>
            </div>
        </div>
    );
}
