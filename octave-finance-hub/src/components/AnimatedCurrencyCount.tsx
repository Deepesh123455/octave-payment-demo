import CountUp from "react-countup";
import { formatCurrency } from "@/data/sampleData";

type AnimatedCurrencyCountProps = {
  value: number;
  durationSeconds?: number;
  className?: string;
};

export function AnimatedCurrencyCount({
  value,
  durationSeconds = 1.8,
  className,
}: AnimatedCurrencyCountProps) {
  const safeValue = Number.isFinite(value) ? value : 0;

  return (
    <CountUp
      end={safeValue}
      duration={durationSeconds}
      separator=","
      decimals={0}
      formattingFn={(currentValue) => formatCurrency(Math.round(currentValue))}
      className={className}
    />
  );
}
