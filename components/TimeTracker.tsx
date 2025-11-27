import React, { useState, useEffect } from 'react';

interface TimeTrackerProps {
  startTime: number;
}

export const TimeTracker: React.FC<TimeTrackerProps> = ({ startTime }) => {
  const [elapsed, setElapsed] = useState<string>('');
  const [colorClass, setColorClass] = useState<string>('text-green-600');

  useEffect(() => {
    const updateTime = () => {
      const now = Date.now();
      const diffMs = now - startTime;
      const diffMins = Math.floor(diffMs / 60000);
      const diffSecs = Math.floor((diffMs % 60000) / 1000);

      setElapsed(`${diffMins}m ${diffSecs}s`);

      // Color logic based on wait time
      if (diffMins < 10) {
        setColorClass('text-green-600 bg-green-100');
      } else if (diffMins < 20) {
        setColorClass('text-yellow-600 bg-yellow-100');
      } else {
        setColorClass('text-red-600 bg-red-100');
      }
    };

    updateTime(); // Initial call
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold ${colorClass}`}>
      {elapsed}
    </span>
  );
};