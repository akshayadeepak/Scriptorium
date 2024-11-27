// components/TextScramble.tsx
import React, { useState, useEffect } from 'react';

interface TextScrambleProps {
  text: string;
  className?: string;
}

const TextScramble: React.FC<TextScrambleProps> = ({ text, className }) => {
  const [displayedText, setDisplayedText] = useState('');
  const chars = 'Abcdefghijklmnop';
  const duration = 1000; // Duration of the animation in milliseconds
  const frameRate = 100;  // Update every 30ms

  useEffect(() => {
    let frame = 0;
    const totalFrames = Math.round(duration / frameRate);
    const oldText = displayedText;
    const length = Math.max(oldText.length, text.length);

    const update = () => {
      let output = '';
      for (let i = 0; i < length; i++) {
        if (i < (frame / totalFrames) * length) {
          output += text[i] || '';
        } else {
          output += chars[Math.floor(Math.random() * chars.length)];
        }
      }
      setDisplayedText(output);

      if (frame < totalFrames) {
        frame++;
        setTimeout(update, frameRate);
      } else {
        // Ensure the final text is set
        setDisplayedText(text);
      }
    };

    update();

    // Cleanup function
    return () => {
      // No cleanup needed in this case
    };
  }, [text]);

  return <p className={className}>{displayedText}</p>;
};

export default TextScramble;

