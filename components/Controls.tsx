
import React from 'react';
import { MorseSettings } from '../types';

interface ControlsProps {
    settings: MorseSettings;
    onSettingsChange: (newSettings: Partial<MorseSettings>) => void;
    isPlaying: boolean;
}

const ControlInput: React.FC<{label: string; children: React.ReactNode}> = ({ label, children }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
        {children}
    </div>
);

const Slider: React.FC<{value: number; min: number; max: number; step: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; disabled: boolean;}> = (props) => (
    <input type="range" {...props} className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed accent-cyan-500" />
);

const TextInput: React.FC<{value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; disabled: boolean; placeholder?: string;}> = (props) => (
    <input type="text" {...props} className="w-full p-2 bg-slate-900 border border-slate-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50" />
);

const NumberInput: React.FC<{value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; min?: number; max?: number; disabled: boolean;}> = (props) => (
    <input type="number" {...props} className="w-full p-2 bg-slate-900 border border-slate-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50" />
);


const Controls: React.FC<ControlsProps> = ({ settings, onSettingsChange, isPlaying }) => {
    
    return (
        <div className="flex flex-col h-full">
            <h2 className="text-xl font-semibold mb-6 text-gray-100">Controls</h2>
            
            <ControlInput label={`Speed (WPM): ${settings.wpm}`}>
                <Slider value={settings.wpm} min={5} max={40} step={1} disabled={isPlaying} onChange={e => onSettingsChange({ wpm: parseInt(e.target.value) })} />
            </ControlInput>

            <ControlInput label={`Tone (Hz): ${settings.tone}`}>
                <Slider value={settings.tone} min={300} max={1200} step={10} onChange={e => onSettingsChange({ tone: parseInt(e.target.value) })} disabled={false} />
            </ControlInput>

            <ControlInput label={`Volume: ${Math.round(settings.volume * 100)}%`}>
                <Slider value={settings.volume} min={0} max={1} step={0.01} onChange={e => onSettingsChange({ volume: parseFloat(e.target.value) })} disabled={false} />
            </ControlInput>

            <ControlInput label="Characters to Generate">
                <TextInput value={settings.characterSet} disabled={isPlaying} onChange={e => onSettingsChange({ characterSet: e.target.value.toUpperCase() })} />
            </ControlInput>

            <ControlInput label="Total Characters to Play">
                <NumberInput value={settings.numChars} min={1} disabled={isPlaying} onChange={e => onSettingsChange({ numChars: parseInt(e.target.value) || 1 })} />
            </ControlInput>

            <ControlInput label="Group Size (0 for none)">
                <NumberInput value={settings.groupSize} min={0} max={10} disabled={isPlaying} onChange={e => onSettingsChange({ groupSize: parseInt(e.target.value) || 0 })} />
            </ControlInput>

            <ControlInput label={`Char Spacing (dot units): ${settings.charSpaces}`}>
                 <Slider value={settings.charSpaces} min={1} max={7} step={1} disabled={isPlaying} onChange={e => onSettingsChange({ charSpaces: parseInt(e.target.value) })} />
            </ControlInput>

            <ControlInput label={`Word Spacing (dot units): ${settings.wordSpaces}`}>
                <Slider value={settings.wordSpaces} min={3} max={15} step={1} disabled={isPlaying} onChange={e => onSettingsChange({ wordSpaces: parseInt(e.target.value) })} />
            </ControlInput>

            <ControlInput label="Preamble (played before start)">
                <TextInput value={settings.preamble} disabled={isPlaying} onChange={e => onSettingsChange({ preamble: e.target.value.toUpperCase() })} placeholder="e.g., VVV"/>
            </ControlInput>
        </div>
    );
};

export default Controls;