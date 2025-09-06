import React from 'react';
import './HorizontalScrollList.css';

export default function HorizontalScrollList({ children }) {
    return (
        <div className="horizontal-scroll-list">
            {children}
        </div>
    );
} 