import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { lessons } from '../data/lessons';
import AudioPlayer from './AudioPlayer';
import { Lesson, Message } from '../types';
import ChatMessage from './ChatMessage'; // Import ChatMessage

interface LessonsProps {
    ai: GoogleGenAI | null;
    isLessonPracticeActive: boolean;
    startSession: (systemInstruction: string, initialMessages?: Message[]) => Promise<void>;
    stopSession: () => void;
    conversation: {
        history: Message[];
        currentInput: string;
        currentOutput: string;
    };
    setConversation: React.Dispatch<React.SetStateAction<{
        history: Message[];
        currentInput: string;
        currentOutput: string;
    }>>;
    error: string | null;
    isConnecting: boolean;
}

const Lessons: React.FC<LessonsProps> = ({ ai, isLessonPracticeActive, startSession, stopSession, conversation, setConversation, error, isConnecting }) => {
    const [activeDay, setActiveDay] = useState(1);
    const lesson = lessons.find(l => l.day === activeDay);

    const getLessonSystemInstruction = (lesson: Lesson): string => {
        let instruction = `You are a friendly and encouraging public speaking coach. Your goal is to help the user practice their vocal cadence, specifically focusing on the principles of Day ${lesson.day}: "${lesson.title}". `;
        
        switch (lesson.day) {
            case 1:
                instruction += `Guide them to understand and practice varying pace, using pauses, and emphasizing words to improve their speech rhythm and flow.`;
                break;
            case 2:
                instruction += `Guide the user in mastering pauses. Encourage them to use intentional pauses to build suspense, add emphasis, and allow the audience to absorb information.`;
                break;
            case 3:
                instruction += `Guide the user in practicing speed variation. Advise them to slow down for important points and speed up for narrative or exciting parts to keep listeners engaged.`;
                break;
            case 4:
                instruction += `Guide the user in practicing emphasis and word stretching. Help them make certain words stand out through volume, pitch, or elongation to convey meaning and draw attention.`;
                break;
            case 5:
                instruction += `Guide the user in matching their tone of voice and vocal energy to their message. Help them express excitement, seriousness, or empathy appropriately.`;
                break;
            case 6:
                instruction += `Guide the user in using powerful hooks with compelling cadence. Help them craft an opening that immediately grabs attention through bold statements, questions, or facts delivered with impact.`;
                break;
            case 7:
                instruction += `The user will be practicing the provided script, "${lesson.practiceScript?.title}". Listen carefully for their overall cadence, including pacing, pausing, and emphasis. Provide specific, actionable feedback based on the script's intended delivery.`;
                break;
            case 8:
                instruction += `The user will be practicing the provided script, "${lesson.practiceScript?.title}". Focus on their ability to convey passion and conviction, using all the techniques learned to deliver an inspirational message effectively.`;
                break;
            default:
                instruction += `Engage in a natural conversation, provide feedback, and offer tips on pacing, pausing, and emphasis.`;
        }
        return instruction;
    };

    const getLessonInitialMessage = (lesson: Lesson): Message => {
        let text = `Hello! Welcome to Day ${lesson.day}: "${lesson.title}" practice. `;
        if (lesson.practiceScript) {
            text += `Today, let's practice the script titled "${lesson.practiceScript.title}". I'll listen and give you feedback on your vocal cadence. Whenever you're ready, just start speaking the script!`;
        } else {
            text += `Let's discuss and practice the concepts from this lesson. Speak into your microphone when you're ready to begin.`;
        }
        return { id: Date.now(), sender: 'system', text: text };
    };

    const handleStartLessonPractice = () => {
        if (lesson) {
            const systemInstruction = getLessonSystemInstruction(lesson);
            const initialMessage = getLessonInitialMessage(lesson);
            startSession(systemInstruction, [initialMessage]);
        }
    };

    const handleEndLessonPractice = () => {
        stopSession();
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 animate-fade-in">
            {isLessonPracticeActive && lesson ? (
                // Display chat when lesson practice is active
                <div className="flex flex-col h-full">
                    <div className="text-center mb-4">
                        <h2 className="text-2xl font-bold text-amber-400 mb-2">Practicing Day {lesson.day}: {lesson.title}</h2>
                        <button
                            onClick={handleEndLessonPractice}
                            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold transition-colors shadow-md"
                        >
                            End Practice
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto mb-4">
                        {conversation.history.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
                        {conversation.currentInput && <ChatMessage message={{ id: -1, sender: 'user', text: conversation.currentInput }} />}
                        {conversation.currentOutput && <ChatMessage message={{ id: -2, sender: 'model', text: conversation.currentOutput }} />}
                        {error && <ChatMessage message={{ id: -3, sender: 'system', text: `Error: ${error}` }} />}
                    </div>
                </div>
            ) : (
                // Display lesson content when not in practice mode
                <>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2 text-amber-400">8-Day Lesson Program</h1>
                    <p className="text-sky-200 mb-6">Learn the fundamentals of great vocal cadence, one day at a time.</p>

                    <div className="flex flex-wrap gap-2 mb-8 border-b border-sky-800 pb-4">
                        {lessons.map(l => (
                            <button
                                key={l.day}
                                onClick={() => setActiveDay(l.day)}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                    activeDay === l.day
                                        ? 'bg-amber-500 text-sky-950'
                                        : 'bg-sky-800 text-sky-200 hover:bg-sky-700'
                                }`}
                                disabled={isConnecting} // Disable tab switching while connecting to main session
                            >
                                Day {l.day}
                            </button>
                        ))}
                    </div>

                    {lesson && (
                        <article className="prose prose-invert max-w-none text-sky-200 prose-headings:text-amber-400">
                            <h2>{lesson.title}</h2>
                            <p>{lesson.description}</p>
                            
                            {lesson.audioSamples && lesson.audioSamples.length > 0 && (
                                <div className="space-y-4 my-6">
                                    {lesson.audioSamples.map((sample, index) => (
                                        <div key={index}>
                                            <h4 className="font-semibold text-white mb-2">{sample.title}</h4>
                                            <AudioPlayer ai={ai} text={sample.text} />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {lesson.practiceScript && (
                                 <div className="bg-sky-900/50 p-6 rounded-xl shadow-lg my-6">
                                    <h3 className="text-xl font-semibold mb-2 text-amber-400">{lesson.practiceScript.title}</h3>
                                    <p className="whitespace-pre-wrap font-mono text-sm">{lesson.practiceScript.script}</p>
                                 </div>
                            )}

                            <div className="mt-8 text-center">
                                <button
                                    onClick={handleStartLessonPractice}
                                    disabled={isConnecting}
                                    className={`px-8 py-3 rounded-full text-lg font-semibold shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center mx-auto
                                        ${isConnecting ? 'bg-amber-500 cursor-not-allowed animate-pulse' : 'bg-amber-600 hover:bg-amber-700'}
                                    `}
                                >
                                    {isConnecting ? (
                                        <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                    )}
                                    Practice with AI
                                </button>
                            </div>
                        </article>
                    )}
                </>
            )}
        </div>
    );
};

export default Lessons;