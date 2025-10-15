
import React, { useState, useEffect } from 'react';
import { RefreshCw, Maximize, Minimize } from './Icons';

interface HeaderProps {
    onReset: () => void;
    onToggleFullscreen: () => void;
}

const Header: React.FC<HeaderProps> = ({ onReset, onToggleFullscreen }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const checkFullscreen = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', checkFullscreen);
        return () => document.removeEventListener('fullscreenchange', checkFullscreen);
    }, []);

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
                <button
                    onClick={onToggleFullscreen}
                    className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors"
                    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                    {isFullscreen ? <Minimize /> : <Maximize />}
                </button>
            </div>
        </header>
    );
};

export default Header;
