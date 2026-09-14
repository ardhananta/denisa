import React, { useState, useEffect, useRef } from 'react';
import { Text, StyleProp, TextStyle } from 'react-native';

export interface TypewriterTextProps {
  text: string;
  speed?: number;
  delay?: number;
  style?: StyleProp<TextStyle>;
  showCursor?: boolean;
  onComplete?: () => void;
}

export default function TypewriterText({
  text,
  speed = 38,
  delay = 350,
  style,
  showCursor = true,
  onComplete,
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Reset state when text changes
    setDisplayedText('');
    setIsTyping(false);

    let currentIndex = 0;

    const startTyping = () => {
      setIsTyping(true);

      const typeNextChar = () => {
        if (currentIndex < text.length) {
          currentIndex += 1;
          setDisplayedText(text.slice(0, currentIndex));
          timeoutRef.current = setTimeout(typeNextChar, speed);
        } else {
          setIsTyping(false);
          if (onComplete) {
            onComplete();
          }
        }
      };

      typeNextChar();
    };

    timeoutRef.current = setTimeout(startTyping, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [text, speed, delay, onComplete]);

  // Cursor blink effect while typing
  useEffect(() => {
    if (!showCursor || !isTyping) {
      setCursorVisible(false);
      return;
    }

    cursorIntervalRef.current = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 450);

    return () => {
      if (cursorIntervalRef.current) clearInterval(cursorIntervalRef.current);
    };
  }, [isTyping, showCursor]);

  return (
    <Text style={style}>
      {displayedText}
      {isTyping && showCursor && (
        <Text style={{ opacity: cursorVisible ? 1 : 0 }}>|</Text>
      )}
    </Text>
  );
}
