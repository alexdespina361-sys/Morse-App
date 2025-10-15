
import React from 'react';

interface DisplayProps {
    text: string;
    isHidden: boolean;
    visibleCount: number;
    groupSize: number;
}

const Display: React.FC<DisplayProps> = ({ text, isHidden, visibleCount, groupSize }) => {
    
    const formatTextWithGroups = (inputText: string): string => {
        if (groupSize <= 0 || !inputText) {
            return inputText;
        }
        
        let result = '';
        for (let i = 0; i < inputText.length; i++) {
            if (i > 0 && i % groupSize === 0) {
                result += ' ';
            }
            result += inputText[i];
        }
        return result;
    };
    
    const visibleText = text.substring(0, visibleCount);
    const displayedText = formatTextWithGroups(visibleText);

    return (
        <div className="relative flex-grow w-full bg-slate-900 rounded-md border border-slate-700 overflow-hidden min-h-[200px] sm:min-h-[300px]">
            <div className="absolute inset-0 p-4 overflow-y-auto">
                <pre className="text-xl md:text-2xl font-mono whitespace-pre-wrap break-words text-cyan-400">
                    {displayedText}
                    <span className="animate-pulse">_</span>
                </pre>
            </div>
            {isHidden && (
                <div className="absolute inset-0 bg-slate-800 bg-opacity-95 backdrop-blur-sm flex items-center justify-center transition-all duration-300">
                    <p className="text-gray-500 text-lg">Text Hidden</p>
                </div>
            )}
        </div>
    );
};

export default Display;