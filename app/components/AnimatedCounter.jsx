'use client';

import { useState, useEffect, useRef } from 'react';

export default function AnimatedCounter({ value, duration = 2000 }) {
    const [count, setCount] = useState(0);
    const countRef = useRef(0);
    const elementRef = useRef(null);

    useEffect(() => {
        let startTime;
        let animationFrame;
        let observer;
        
        // Ensure value is a number
        const targetValue = parseInt(value, 10) || 0;
        
        if (targetValue === 0) {
            setCount(0);
            return;
        }

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            
            const percentage = Math.min(progress / duration, 1);
            // easeOutExpo for a smooth deceleration
            const easeOut = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);
            
            const currentCount = Math.floor(easeOut * targetValue);
            
            if (countRef.current !== currentCount) {
                setCount(currentCount);
                countRef.current = currentCount;
            }
            
            if (progress < duration) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                setCount(targetValue);
            }
        };

        const startAnimation = () => {
            startTime = null;
            animationFrame = requestAnimationFrame(animate);
        };

        // Start animation when the element scrolls into view
        if (elementRef.current) {
            observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    startAnimation();
                    observer.disconnect(); // Run only once
                }
            }, { threshold: 0.1 });
            
            observer.observe(elementRef.current);
        } else {
            startAnimation();
        }

        return () => {
            if (animationFrame) cancelAnimationFrame(animationFrame);
            if (observer) observer.disconnect();
        };
    }, [value, duration]);

    return <span ref={elementRef}>{count}</span>;
}
