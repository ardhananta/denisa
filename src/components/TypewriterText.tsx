import React, { useState, useEffect, useRef } from 'react';
import { Text, StyleProp, TextStyle } from 'react-native';

export interface TypewriterTextProps {
  text: string;
  speed?: number;
  delay?: number;
  style?: StyleProp<TextStyle>;
  showCursor?: boolean;
  onTypingStateChange?: (isTyping: boolean) => void;
  onComplete?: () => void;
}

export default function TypewriterText({
  text,
  speed = 32,
  delay = 100,
  style,
  showCursor = true,
  onTypingStateChange,
  onComplete,
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Store callbacks in refs to prevent unnecessary effect re-runs when parent re-renders
  const onTypingStateChangeRef = useRef(onTypingStateChange);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onTypingStateChangeRef.current = onTypingStateChange;
  }, [onTypingStateChange]);

  // Official React pattern: reset displayedText when text prop changes
  const [prevText, setPrevText] = useState(text);
  if (text !== prevText) {
    setPrevText(text);
    setDisplayedText('');
  }

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!text) {
      return;
    }

    let currentIndex = 0;

    const startTimeout = setTimeout(() => {
      setDisplayedText('');
      setIsTyping(true);
      onTypingStateChangeRef.current?.(true);

      const typeNextChar = () => {
        if (currentIndex < text.length) {
          currentIndex += 1;
          setDisplayedText(text.slice(0, currentIndex));
          timeoutRef.current = setTimeout(typeNextChar, speed);
        } else {
          setIsTyping(false);
          onTypingStateChangeRef.current?.(false);
          onCompleteRef.current?.();
        }
      };

      typeNextChar();
    }, delay);

    return () => {
      clearTimeout(startTimeout);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      onTypingStateChangeRef.current?.(false);
    };
  }, [text, speed, delay]);

  // Cursor blink effect while typing
  useEffect(() => {
    if (!showCursor || !isTyping) {
      return;
    }

    const interval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 450);

    return () => {
      clearInterval(interval);
    };
  }, [isTyping, showCursor]);

  const showCursorEffect = isTyping && showCursor && cursorVisible;

  return (
    <Text style={style}>
      {displayedText}
      {showCursorEffect && <Text style={{ opacity: 1 }}>|</Text>}
    </Text>
  );
}
