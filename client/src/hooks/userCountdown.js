import { useEffect, useState } from "react";

const calculateRemainingSeconds = (
  targetDate
) => {
  if (!targetDate) {
    return 0;
  }

  return Math.max(
    0,
    Math.ceil(
      (new Date(targetDate).getTime() -
        Date.now()) /
        1000
    )
  );
};

const useCountdown = (targetDate) => {
  const [remainingSeconds, setRemainingSeconds] =
    useState(() =>
      calculateRemainingSeconds(targetDate)
    );

  useEffect(() => {
    setRemainingSeconds(
      calculateRemainingSeconds(targetDate)
    );

    if (!targetDate) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setRemainingSeconds(
        calculateRemainingSeconds(targetDate)
      );
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [targetDate]);

  return remainingSeconds;
};

export default useCountdown;