import React from 'react';
import { Message } from '../types';

const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
    const isModel = message.sender === 'model';
    const isSystem = message.sender === 'system';

    if (isSystem) {
        return (
            <div className="text-center text-sm text-gray-500 py-2">
                {message.text}
            </div>
        );
    }
    
    return (
        <div className={`flex ${isModel ? 'justify-start' : 'justify-end'} mb-4 animate-fade-in`}>
            <div className={`max-w-md p-4 rounded-2xl shadow-md ${isModel ? 'bg-sky-800 rounded-bl-none' : 'bg-amber-600 rounded-br-none'}`}>
                <p className="text-white">{message.text}</p>
            </div>
        </div>
    );
};

export default ChatMessage;
