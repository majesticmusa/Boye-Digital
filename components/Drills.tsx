import React, { useState } from 'react';
import { drills } from '../data/drills';

const Drills: React.FC = () => {
    const [completed, setCompleted] = useState<boolean[]>(Array(drills.length).fill(false));

    const handleToggle = (index: number) => {
        const newCompleted = [...completed];
        newCompleted[index] = !newCompleted[index];
        setCompleted(newCompleted);
    };

    const completedCount = completed.filter(Boolean).length;
    const progress = (completedCount / drills.length) * 100;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-amber-400">Daily Warm-Up</h1>
            <p className="text-sky-200 mb-6">A quick 5-minute routine to get you ready to record or speak.</p>

            <div className="mb-8">
                <div className="flex justify-between items-center mb-2 text-sm">
                    <span className="text-sky-200">Progress</span>
                    <span className="font-semibold text-amber-400">{completedCount} / {drills.length} Completed</span>
                </div>
                <div className="w-full bg-sky-800 rounded-full h-2.5">
                    <div className="bg-amber-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            <div className="space-y-4">
                {drills.map((drill, index) => (
                    <div key={index} className="bg-sky-900/50 p-4 rounded-lg flex items-start gap-4 transition-colors hover:bg-sky-900">
                        <input
                            type="checkbox"
                            id={`drill-${index}`}
                            checked={completed[index]}
                            onChange={() => handleToggle(index)}
                            className="mt-1 h-5 w-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                        <label htmlFor={`drill-${index}`} className="flex-1 cursor-pointer">
                            <h3 className={`font-bold text-lg ${completed[index] ? 'line-through text-gray-500' : 'text-white'}`}>
                                {drill.title}
                                <span className="ml-2 text-xs font-mono bg-sky-800 px-2 py-0.5 rounded-full text-amber-300">{drill.duration}</span>
                            </h3>
                            <p className="text-sky-300">{drill.description}</p>
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Drills;
