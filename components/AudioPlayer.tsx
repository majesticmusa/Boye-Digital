import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { decode, decodeAudioData } from '../utils/audioUtils';

interface AudioPlayerProps {
    ai: GoogleGenAI | null;
    text: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ ai, text }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

    const audioBufferRef = useRef<AudioBuffer | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
    const startTimeRef = useRef<number>(0);
    const progressIntervalRef = useRef<number | null>(null);

    const cleanup = useCallback(() => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
        sourceNodeRef.current?.stop();
        sourceNodeRef.current?.disconnect();
        sourceNodeRef.current = null;
    }, []);

    useEffect(() => {
        // FIX: Cast window to `any` to allow access to vendor-prefixed `webkitAudioContext` on older browsers.
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        return () => {
            cleanup();
            audioContextRef.current?.close();
        };
    }, [cleanup]);

    const generateAudio = async () => {
        if (!ai || !text) return;
        setIsLoading(true);
        setError(null);
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Kore' },
                        },
                    },
                },
            });
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
                const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
                audioBufferRef.current = audioBuffer;
                return audioBuffer;
            } else {
                throw new Error("No audio data received.");
            }
        } catch (err) {
            console.error("Audio generation failed:", err);
            setError("Could not generate audio.");
        } finally {
            setIsLoading(false);
        }
    };

    const play = (buffer: AudioBuffer) => {
        if (!audioContextRef.current) return;
        cleanup();
        
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.start(0);

        sourceNodeRef.current = source;
        setIsPlaying(true);
        startTimeRef.current = audioContextRef.current.currentTime;

        source.onended = () => {
            setIsPlaying(false);
            setProgress(0);
            cleanup();
        };

        progressIntervalRef.current = window.setInterval(() => {
            if (audioContextRef.current && source.buffer) {
                const elapsedTime = audioContextRef.current.currentTime - startTimeRef.current;
                const newProgress = (elapsedTime / source.buffer.duration) * 100;
                if (newProgress <= 100) {
                    setProgress(newProgress);
                }
            }
        }, 100);
    };

    const handlePlayPause = async () => {
        if (isPlaying) {
           // Basic pause is complex with Web Audio API, so we treat it as a stop/reset for now
           cleanup();
           setIsPlaying(false);
           setProgress(0);
        } else {
            if (audioBufferRef.current) {
                play(audioBufferRef.current);
            } else {
                const buffer = await generateAudio();
                if (buffer) {
                    play(buffer);
                }
            }
        }
    };
    
    const handleReset = () => {
        cleanup();
        setIsPlaying(false);
        setProgress(0);
    }

    const Icon = isPlaying ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 00-1 1v2a1 1 0 102 0V9a1 1 0 00-1-1zm5 0a1 1 0 00-1 1v2a1 1 0 102 0V9a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
    ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
    )

    return (
        <div className="flex items-center gap-3 bg-sky-800/50 p-3 rounded-lg">
            <button
                onClick={handlePlayPause}
                disabled={isLoading}
                className="w-8 h-8 flex-shrink-0 rounded-full bg-amber-500 text-white flex items-center justify-center disabled:bg-gray-500 transition-colors"
                aria-label={isPlaying ? "Pause" : "Play"}
            >
                {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : Icon}
            </button>
            <div className="flex-grow bg-sky-900 rounded-full h-2 overflow-hidden">
                <div className="bg-amber-400 h-full" style={{ width: `${progress}%` }}></div>
            </div>
            <button onClick={handleReset} className="text-sky-300 hover:text-white" aria-label="Reset audio">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9a9 9 0 0114.13-4.25M20 15a9 9 0 01-14.13 4.25" /></svg>
            </button>
            {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>
    );
};

export default AudioPlayer;
