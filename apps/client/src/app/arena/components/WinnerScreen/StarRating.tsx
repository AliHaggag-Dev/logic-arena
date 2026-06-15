import React from 'react';
import styles from './WinnerScreen.module.css';

const STAR_ANIMATION_BASE_DELAY_MS = 500;
const STAR_ANIMATION_INTERVAL_MS = 500;

interface StarRatingProps {
  earnedStars: number;
}

export const StarRating: React.FC<StarRatingProps> = ({ earnedStars }) => {
  const totalStars = 3;
  return (
    <div className={styles.stars} role="img" aria-label={`${earnedStars} out of ${totalStars} stars`}>
      {Array.from({ length: totalStars }, (_, i) => {
        const isEarned = i < earnedStars;
        const delayMs = STAR_ANIMATION_BASE_DELAY_MS + i * STAR_ANIMATION_INTERVAL_MS;
        return (
          <span
            key={i}
            className={`${styles.star} ${isEarned ? styles.starEarned : styles.starEmpty}`}
            style={{ animationDelay: `${delayMs}ms` }}
            aria-hidden="true"
          >
            ★
          </span>
        );
      })}
    </div>
  );
};
