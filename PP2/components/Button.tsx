import React, { ReactNode } from 'react';

interface ButtonProps {
    onClick: () => void;
    children: ReactNode;
}

export default function Button({ onClick, children }: ButtonProps) {
    return (
        <button 
            onClick={onClick} 
            className="block w-[95%] mx-auto my-10 p-10 bg-gray-400 hover:bg-gray-500 transition-colors"
        >
        </button>
    );
} 