import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { lessons } from '../data/lessons';
import AudioPlayer from './AudioPlayer';

interface LessonsProps {
    ai: GoogleGenAI | null;
}

const Lessons: React.FC<LessonsProps> = ({ ai }) => {
    const [activeDay, setActiveDay] = useState(1);
    const lesson = lessons.find(l => l.day === activeDay);

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 animate-fade-in">
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
                </article>
            )}
        </div>
    );
};

export default Lessons;
