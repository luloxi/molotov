'use client';

import { useState } from 'react';
import styles from './InfoTooltip.module.css';

interface InfoTooltipProps {
  text: string;
}

export function InfoTooltip({ text }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span 
      className={styles.container}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => setIsVisible(!isVisible)}
    >
      <span className={styles.icon}>i</span>
      {isVisible && (
        <span className={styles.tooltip}>
          {text}
          <span className={styles.arrow} />
        </span>
      )}
    </span>
  );
}
