import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality } from "@google/genai";
import { Message } from './types';
import { createBlob, decode, decodeAudioData } from './utils/audioUtils';
import ChatMessage from './components/ChatMessage';
import Lessons from './components/Lessons';
import Drills from './components/Drills';

export default function App() {
    const [isMainSessionActive, setIsMainSessionActive] = useState(false);
    const [isLessonPracticeActive, setIsLessonPracticeActive] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'lessons' | 'drills'>('lessons');

    const [conversation, setConversation] = useState<{
        history: Message[];
        currentInput: string;
        currentOutput: string;
    }>({
        history: [], // Start with an empty history, will be populated by system or initial messages
        currentInput: '',
        currentOutput: '',
    });
    
    const aiRef = useRef<GoogleGenAI | null>(null);
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const micStreamRef = useRef<MediaStream | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      try {
        aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      } catch (err) {
        console.error("Failed to initialize GoogleGenAI", err);
        setError("Failed to initialize AI. Please check the API key.");
      }
    }, []);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [conversation]);

    const stopSession = useCallback(async () => {
        if (sessionPromiseRef.current) {
            try {
                const session = await sessionPromiseRef.current;
                session.close();
            } catch (e) {
                console.error("Error closing session:", e);
            } finally {
                sessionPromiseRef.current = null;
            }
        }

        micStreamRef.current?.getTracks().forEach(track => track.stop());
        micStreamRef.current = null;
        
        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;
        
        inputAudioContextRef.current?.close().catch(console.error);
        inputAudioContextRef.current = null;
        
        outputAudioContextRef.current?.close().catch(console.error);
        outputAudioContextRef.current = null;
        
        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        nextStartTimeRef.current = 0;

        setIsMainSessionActive(false);
        setIsLessonPracticeActive(false);
        setIsConnecting(false);
        setConversation({ history: [], currentInput: '', currentOutput: '' }); // Clear conversation on stop
    }, []);

    const startSession = useCallback(async (systemInstruction: string, initialMessages: Message[] = []) => {
        if (!aiRef.current) {
            setError("AI not initialized.");
            return;
        }
        stopSession(); // Ensure any existing session is stopped
        setError(null);
        setIsConnecting(true);
        setConversation({ history: initialMessages, currentInput: '', currentOutput: '' });

        try {
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            micStreamRef.current = stream;

            sessionPromiseRef.current = aiRef.current.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
                    },
                    systemInstruction: systemInstruction,
                },
                callbacks: {
                    onopen: () => {
                        setIsConnecting(false);
                        // Determine if it's a main session or lesson practice based on the current tab or context
                        if (activeTab === 'lessons') { // Assuming startSession is only called for lesson practice when on lessons tab.
                           setIsLessonPracticeActive(true);
                        } else {
                           setIsMainSessionActive(true);
                        }
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
                            
                            const source = outputAudioContextRef.current.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContextRef.current.destination);
                            
                            source.addEventListener('ended', () => sourcesRef.current.delete(source));
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }

                        if (message.serverContent?.interrupted) {
                            sourcesRef.current.forEach(source => source.stop());
                            sourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                        }

                        if (message.serverContent?.inputTranscription) {
                            setConversation(prev => ({...prev, currentInput: prev.currentInput + message.serverContent!.inputTranscription!.text}));
                        }
                        if (message.serverContent?.outputTranscription) {
                           setConversation(prev => ({...prev, currentOutput: prev.currentOutput + message.serverContent!.outputTranscription!.text}));
                        }
                        if (message.serverContent?.turnComplete) {
                            setConversation(prev => {
                                const newHistory = [...prev.history];
                                if (prev.currentInput.trim()) {
                                    newHistory.push({ id: Date.now(), sender: 'user', text: prev.currentInput.trim() });
                                }
                                if (prev.currentOutput.trim()) {
                                    newHistory.push({ id: Date.now() + 1, sender: 'model', text: prev.currentOutput.trim() });
                                }
                                return { history: newHistory, currentInput: '', currentOutput: '' };
                            });
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Session error:', e);
                        setError('An error occurred. Please try again.');
                        stopSession();
                    },
                    onclose: (e: CloseEvent) => {
                        // Only set active to false if it was truly active
                        if (isMainSessionActive || isLessonPracticeActive) {
                            stopSession();
                        }
                    },
                }
            });

        } catch (err) {
            console.error(err);
            setError('Failed to start session. Please check microphone permissions.');
            setIsConnecting(false);
            setIsMainSessionActive(false);
            setIsLessonPracticeActive(false);
        }
    }, [stopSession, activeTab, isMainSessionActive, isLessonPracticeActive]); // Added activeTab to dependency array

    const handleStartMainSession = useCallback(() => {
        const systemInstruction = 'You are a friendly and encouraging public speaking coach. Your goal is to help the user practice their vocal cadence. Engage in a natural conversation, provide feedback, and offer tips on pacing, pausing, and emphasis.';
        const initialMessages: Message[] = [{id: 0, sender: 'system', text: 'Your practice session has started. Speak into your microphone.'}];
        startSession(systemInstruction, initialMessages);
        setIsMainSessionActive(true); // Manually set to true for main session
        setActiveTab('lessons'); // Ensure we are on a tab that doesn't conflict with chat UI
    }, [startSession]);

    const handleEndCurrentSession = useCallback(() => {
        stopSession();
        // No need to set activeTab, it will revert to its previous state
    }, [stopSession]);
    
    const getStatus = () => {
        const sessionActive = isMainSessionActive || isLessonPracticeActive;
        if (isConnecting) return { text: 'Connecting...', color: 'amber' };
        if (!sessionActive) return { text: 'Inactive', color: 'gray' };
        if (conversation.currentOutput) return { text: 'Speaking...', color: 'amber' };
        if (conversation.currentInput) return { text: 'Listening...', color: 'green' };
        return { text: 'Idle', color: 'green' };
    };

    const status = getStatus();
    const showChat = isMainSessionActive || isLessonPracticeActive || isConnecting;

    const TabButton: React.FC<{tab: 'lessons' | 'drills', children: React.ReactNode}> = ({tab, children}) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 
                ${activeTab === tab ? 'text-amber-400 border-amber-400' : 'text-sky-300 border-transparent hover:bg-sky-800/50'}`}
        >
            {children}
        </button>
    )

    return (
        <div className="flex flex-col h-screen bg-sky-950 text-white">
            <header className="flex-shrink-0 bg-sky-900/50 backdrop-blur-sm shadow-md p-4 flex justify-between items-center z-10">
                <h1 className="text-xl font-bold text-white flex items-center">
                  <span className="text-3xl mr-2">🎙️</span> AI Cadence Coach
                </h1>
                <div className="flex items-center space-x-2">
                    <span className={`relative flex h-3 w-3`}>
                        <span className={`${(isMainSessionActive || isLessonPracticeActive) ? 'animate-ping' : ''} absolute inline-flex h-full w-full rounded-full bg-${status.color}-400 opacity-75`}></span>
                        <span className={`relative inline-flex rounded-full h-3 w-3 bg-${status.color}-500`}></span>
                    </span>
                    <span>{status.text}</span>
                </div>
            </header>
            
            {!showChat && (
                <nav className="flex-shrink-0 px-4 md:px-8 border-b border-sky-800">
                    <TabButton tab="lessons">Lessons</TabButton>
                    <TabButton tab="drills">Daily Drills</TabButton>
                </nav>
            )}

            <main className="flex-1 overflow-y-auto pb-32">
                 {showChat ? (
                    <div ref={chatContainerRef} className="max-w-4xl mx-auto p-4 md:p-8">
                        {isLessonPracticeActive && (
                            <div className="text-center mb-4">
                                <button
                                    onClick={handleEndCurrentSession}
                                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold transition-colors shadow-md"
                                >
                                    End Practice
                                </button>
                            </div>
                        )}
                        {conversation.history.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
                        {conversation.currentInput && <ChatMessage message={{ id: -1, sender: 'user', text: conversation.currentInput }} />}
                        {conversation.currentOutput && <ChatMessage message={{ id: -2, sender: 'model', text: conversation.currentOutput }} />}
                        {error && <ChatMessage message={{ id: -3, sender: 'system', text: `Error: ${error}` }} />}
                    </div>
                ) : (
                    activeTab === 'lessons' ? 
                        <Lessons 
                            ai={aiRef.current} 
                            isLessonPracticeActive={isLessonPracticeActive}
                            startSession={startSession}
                            stopSession={stopSession}
                            conversation={conversation}
                            setConversation={setConversation}
                            error={error}
                            isConnecting={isConnecting}
                        /> 
                        : <Drills />
                )}
            </main>

            <footer className="fixed bottom-0 left-0 right-0 p-4 flex justify-center bg-gradient-to-t from-sky-950 to-transparent">
                <button
                    onClick={handleStartMainSession}
                    disabled={isConnecting || isLessonPracticeActive} // Disable if connecting or lesson practice is active
                    aria-label={isMainSessionActive ? 'Stop main session' : 'Start main practice session'}
                    className={`relative w-20 h-20 rounded-full text-white shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center
                        ${isConnecting ? 'bg-amber-500 cursor-not-allowed animate-pulse' : isMainSessionActive ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}
                        ${isLessonPracticeActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isConnecting ? (
                        <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : isMainSessionActive ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4zm5 2.5a.5.5 0 01.5.5v3a.5.5 0 01-1 0v-3a.5.5 0 01.5-.5zM8 7a.5.5 0 00-.5.5v3a.5.5 0 001 0v-3A.5.5 0 008 7z" /><path d="M4.5 9.5a.5.5 0 000 1h11a.5.5 0 000-1h-11z" /></svg>
                    )}
                </button>
            </footer>
        </div>
    );
}