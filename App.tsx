
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MorseSettings } from './types';
import { MORSE_CODE_MAP } from './constants';
import Controls from './components/Controls';
import Display from './components/Display';
import Header from './components/Header';
import { PlayIcon, StopIcon, EyeIcon, EyeSlashIcon } from './components/Icons';

interface UiUpdate {
    char: string;
    time: number;
}

const initialSettings: MorseSettings = {
    wpm: 20,
    characterSet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    groupSize: 5,
    charSpaces: 3,
    wordSpaces: 7,
    volume: 0.5,
    numChars: 100,
    preamble: 'VVV',
    tone: 600,
};

const App: React.FC = () => {
    const [settings, setSettings] = useState<MorseSettings>(initialSettings);

    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [generatedText, setGeneratedText] = useState<string>('');
    const [visibleCharsCount, setVisibleCharsCount] = useState<number>(0);
    const [isTextHidden, setIsTextHidden] = useState<boolean>(false);
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const oscillatorRef = useRef<OscillatorNode | null>(null);
    const envelopeGainRef = useRef<GainNode | null>(null);
    const masterGainRef = useRef<GainNode | null>(null);
    
    const stopPlaybackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const scheduledUiUpdatesRef = useRef<UiUpdate[]>([]);
    const isPlayingRef = useRef(false);
    
    const cleanupAudio = useCallback(() => {
        if (stopPlaybackTimeoutRef.current) {
            clearTimeout(stopPlaybackTimeoutRef.current);
            stopPlaybackTimeoutRef.current = null;
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        if (envelopeGainRef.current && audioContextRef.current && audioContextRef.current.state === 'running') {
            const gain = envelopeGainRef.current.gain;
            const now = audioContextRef.current.currentTime;
            gain.cancelScheduledValues(now);
            gain.setTargetAtTime(0, now, 0.01);
        }
        scheduledUiUpdatesRef.current = [];
    }, []);
    
    useEffect(() => {
      return () => {
        cleanupAudio();
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(console.error);
        }
      }
    }, [cleanupAudio]);

    const handleSettingsChange = useCallback((newSettings: Partial<MorseSettings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
        if (audioContextRef.current) {
            const now = audioContextRef.current.currentTime;
            if (masterGainRef.current && newSettings.volume !== undefined) {
                 masterGainRef.current.gain.setTargetAtTime(newSettings.volume, now, 0.01);
            }
            if (oscillatorRef.current && newSettings.tone !== undefined) {
                oscillatorRef.current.frequency.setTargetAtTime(newSettings.tone, now, 0.01);
            }
        }
    }, []);

    const handleStartStop = useCallback(() => {
        if (isPlaying) {
            isPlayingRef.current = false;
            setIsPlaying(false);
            cleanupAudio();
            return;
        }

        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            try {
                const context = new (window.AudioContext || (window as any).webkitAudioContext)();
                audioContextRef.current = context;
                const oscillator = context.createOscillator();
                const envelopeGain = context.createGain();
                const masterGain = context.createGain();
                
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(settings.tone, context.currentTime);
                masterGain.gain.setValueAtTime(settings.volume, context.currentTime);
                envelopeGain.gain.setValueAtTime(0, context.currentTime);
                
                oscillator.connect(envelopeGain);
                envelopeGain.connect(masterGain);
                masterGain.connect(context.destination);
                oscillator.start();

                oscillatorRef.current = oscillator;
                envelopeGainRef.current = envelopeGain;
                masterGainRef.current = masterGain;
            } catch (e) {
                console.error("Web Audio API is not supported in this browser.", e);
                alert("Could not initialize audio. Your browser may not support the Web Audio API.");
                return;
            }
        }
        
        if(audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }

        isPlayingRef.current = true;
        setIsPlaying(true);
        setGeneratedText('');
        setVisibleCharsCount(0);
        scheduledUiUpdatesRef.current = [];

        const generateRandomText = () => {
            let result = '';
            const chars = settings.characterSet.split('');
            if (chars.length === 0) return '';
            for (let i = 0; i < settings.numChars; i++) {
                result += chars[Math.floor(Math.random() * chars.length)];
            }
            return result;
        };

        const randomText = generateRandomText();
        const fullText = (settings.preamble || '') + randomText;
        if (!fullText) {
          isPlayingRef.current = false;
          setIsPlaying(false);
          return;
        }
        
        setGeneratedText(randomText);

        const dotDuration = 1.2 / settings.wpm;
        const audioContext = audioContextRef.current;
        const envelopeGain = envelopeGainRef.current;
        if (!audioContext || !envelopeGain) return;
        
        let scheduleTime = audioContext.currentTime;
        const preambleLength = settings.preamble?.length || 0;

        const scheduleTone = (startTime: number, duration: number) => {
            const rampTime = 0.005; 
            const gain = envelopeGain.gain;
            if (duration > rampTime * 2) {
                gain.setTargetAtTime(1, startTime, rampTime / 3);
                gain.setTargetAtTime(0, startTime + duration - rampTime, rampTime / 3);
            } else { 
                gain.setValueAtTime(1, startTime);
                gain.setValueAtTime(0, startTime + duration);
            }
        };

        for (let i = 0; i < fullText.length; i++) {
            const char = fullText[i].toUpperCase();
            const morse = MORSE_CODE_MAP[char];
            
            const isPreamble = i < preambleLength;
            
            if (!isPreamble) {
                scheduledUiUpdatesRef.current.push({
                    char: fullText[i],
                    time: scheduleTime,
                });
            }

            if (morse) {
                for (let j = 0; j < morse.length; j++) {
                    const element = morse[j];
                    const duration = (element === '.') ? dotDuration : dotDuration * 3;
                    scheduleTone(scheduleTime, duration);
                    scheduleTime += duration;

                    if (j < morse.length - 1) {
                        scheduleTime += dotDuration;
                    }
                }
            }

            const isLastChar = i === fullText.length - 1;
            if (!isLastChar) {
                const nextIsGroupBoundary = settings.groupSize > 0 && (i - preambleLength + 1) % settings.groupSize === 0;
                
                if (nextIsGroupBoundary && i >= preambleLength) {
                    scheduleTime += settings.wordSpaces * dotDuration;
                } else {
                    scheduleTime += settings.charSpaces * dotDuration;
                }
            }
        }
        
        const uiUpdateLoop = () => {
            if (!isPlayingRef.current) {
                animationFrameRef.current = null;
                return;
            }
            const audioCtx = audioContextRef.current;
            if (!audioCtx) return;

            const now = audioCtx.currentTime;
            const updates = scheduledUiUpdatesRef.current;
            let lastVisibleIndex = -1;

            for (let i = 0; i < updates.length; i++) {
                if (now >= updates[i].time) {
                    lastVisibleIndex = i;
                } else {
                    break;
                }
            }
            
            const newVisibleCount = lastVisibleIndex + 1;
            setVisibleCharsCount(newVisibleCount);

            animationFrameRef.current = requestAnimationFrame(uiUpdateLoop);
        };
        animationFrameRef.current = requestAnimationFrame(uiUpdateLoop);
        
        const totalDuration = Math.max(0, (scheduleTime - audioContext.currentTime) * 1000);
        stopPlaybackTimeoutRef.current = setTimeout(() => {
            isPlayingRef.current = false;
            setIsPlaying(false);
        }, totalDuration + 200);

    }, [isPlaying, settings, cleanupAudio]);
    
    const handleReset = useCallback(() => {
      if (!isPlaying) {
        setSettings(initialSettings);
      }
    }, [isPlaying]);

    const handleToggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(console.error);
        } else {
            document.exitFullscreen().catch(console.error);
        }
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
             <Header onReset={handleReset} onToggleFullscreen={handleToggleFullscreen} />
            <div className="w-full max-w-5xl mx-auto">
                <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 bg-slate-800 p-6 rounded-lg shadow-lg">
                       <Controls settings={settings} onSettingsChange={handleSettingsChange} isPlaying={isPlaying} />
                    </div>

                    <div className="md:col-span-2 bg-slate-800 p-6 rounded-lg shadow-lg flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                             <button
                                onClick={handleStartStop}
                                className={`w-32 px-6 py-3 text-lg font-semibold rounded-md flex items-center justify-center gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                                    isPlaying 
                                    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                                    : 'bg-cyan-600 hover:bg-cyan-700 focus:ring-cyan-500'
                                }`}
                                aria-label={isPlaying ? 'Stop Morse Code' : 'Start Morse Code'}
                            >
                                {isPlaying ? <StopIcon /> : <PlayIcon />}
                                {isPlaying ? 'Stop' : 'Start'}
                            </button>
                            <button
                                onClick={() => setIsTextHidden(prev => !prev)}
                                className={`p-3 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500 border-2 ${isTextHidden ? 'border-transparent' : 'border-cyan-500'}`}
                                title={isTextHidden ? "Show Text" : "Hide Text"}
                                aria-label={isTextHidden ? "Show Generated Text" : "Hide Generated Text"}
                            >
                               {isTextHidden ? <EyeSlashIcon /> : <EyeIcon />}
                            </button>
                        </div>
                        
                        <Display 
                            text={generatedText} 
                            isHidden={isTextHidden}
                            visibleCount={visibleCharsCount}
                            groupSize={settings.groupSize}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;