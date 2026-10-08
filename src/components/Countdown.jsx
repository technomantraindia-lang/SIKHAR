import React, { useState, useEffect } from 'react';

export default function Countdown({ targetDate }) {
  const calculateTimeLeft = () => {
    const difference = +new Date(targetDate) - +new Date();
    let timeLeft = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    } else {
      timeLeft = { days: 28, hours: 14, minutes: 36, seconds: 48 };
    }

    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const timeUnits = [
    { label: 'DAYS', value: timeLeft.days, max: 60 },
    { label: 'HOURS', value: timeLeft.hours, max: 24 },
    { label: 'MINUTES', value: timeLeft.minutes, max: 60 },
    { label: 'SECONDS', value: timeLeft.seconds, max: 60 },
  ];

  return (
    <div className="countdown-container">
      <div className="countdown-title-row">
        <span className="countdown-pulse-dot" />
        <span className="countdown-header-text">ESTIMATED PUBLIC LAUNCH IN</span>
      </div>

      <div className="countdown-grid">
        {timeUnits.map((unit, index) => {
          const formattedValue = String(unit.value).padStart(2, '0');
          return (
            <div key={unit.label} className="countdown-card glass-card">
              <div className="countdown-card-glow" />
              <div className="countdown-digit-wrapper">
                <span className="countdown-digit">{formattedValue}</span>
              </div>
              <span className="countdown-label">{unit.label}</span>
              {index < timeUnits.length - 1 && (
                <div className="countdown-divider">:</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
