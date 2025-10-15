import React from 'react';
import { RefreshCw } from './Icons';

interface HeaderProps {
    onReset: () => void;
}

const Header: React.FC<HeaderProps> = ({ onReset }) => {
    return (
        <header className="flex justify-between items-center w-full max-w-5xl mx-auto mb-4 px-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-100">
                Morse Code Generator
            </h1>
            <div className="flex items-center gap-2">
                <button
                    onClick={onReset}
                    className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors"
                    title="Reset Settings"
                    aria-label="Reset Settings"
                >
                    <RefreshCw />
                </button>
            </div>
        </header>
    );
};

export default Header;