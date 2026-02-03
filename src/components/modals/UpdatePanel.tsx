import React, { useRef, useEffect } from 'react';
import { X, Calendar, ChevronRight } from 'lucide-react';
import { SOFTWARE_UPDATES } from '../../utils/updateData';

interface UpdatePanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export const UpdatePanel: React.FC<UpdatePanelProps> = ({ isOpen, onClose }) => {
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={panelRef}
            className="absolute top-16 right-4 w-96 z-[300] bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700 overflow-hidden flex flex-col max-h-[70vh] animate-in slide-in-from-top-2 duration-300 ring-1 ring-white/10"
        >
            {/* Header */}
            <div className="px-5 py-3 border-b border-gray-700 flex justify-between items-center bg-gray-800/30">
                <div className="flex flex-col">
                    <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                        What's New
                    </h2>
                </div>
                <button
                    onClick={onClose}
                    className="cursor-pointer p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
                {SOFTWARE_UPDATES.map((update) => (
                    <div key={update.version} className="relative group">
                        <div className="flex gap-4">
                            {/* Version Dot */}
                            <div className="relative z-10 w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-0.5" />

                            <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-white">Version {update.version}</h3>
                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(update.date).toLocaleDateString()}
                                    </div>
                                </div>

                                <ul className="space-y-1.5">
                                    {update.changes.map((change, i) => (
                                        <li key={i} className="flex gap-2 text-xs text-gray-400">
                                            <ChevronRight className="w-3 h-3 text-blue-500/50 shrink-0 mt-0.5" />
                                            <span>{change}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
