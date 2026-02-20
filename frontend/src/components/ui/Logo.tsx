import Image from "next/image";

interface LogoProps {
  variant?: "full" | "mark";
  colorScheme?: "color" | "white";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: { mark: 24, text: "text-sm" },
  md: { mark: 32, text: "text-lg" },
  lg: { mark: 40, text: "text-xl" },
} as const;

export function Logo({
  variant = "full",
  colorScheme = "color",
  size = "md",
  className = "",
}: LogoProps) {
  const { mark, text } = sizes[size];
  const src =
    colorScheme === "white"
      ? "/logo/logomark-white.png"
      : "/logo/logomark.png";

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src={src}
        alt="TNE Assessment"
        width={mark}
        height={mark}
        className="shrink-0"
        priority
      />
      {variant === "full" && (
        <span
          className={`${text} font-semibold tracking-tight ${
            colorScheme === "white" ? "text-white" : "text-slate-900"
          }`}
        >
          TNE Assess
        </span>
      )}
    </span>
  );
}
