import { cn } from "@/lib/utils";

interface CouncilLogoProps {
  className?: string;
  size?: number;
}

export function CouncilLogo({ className, size = 24 }: CouncilLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("flex-shrink-0", className)}
    >
      {/* Outer glowing orbital paths forming a stylized 'C' */}
      <path
        d="M18 6C16.2 4.2 13.8 3 11 3C6 3 2 7 2 12C2 17 6 21 11 21C13.8 21 16.2 19.8 18 18"
        stroke="url(#council-orbit-grad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* Intersecting inner loop creating a synthesis knot/chamber structure */}
      <path
        d="M12 7C9.2 7 7 9.2 7 12C7 14.8 9.2 17 12 17C14 17 15.8 15.8 16.5 14"
        stroke="url(#council-inner-grad)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      
      {/* Glowing nodes representing council members (the AIs) sitting at the chamber */}
      <circle cx="11" cy="3" r="1.8" fill="#4F46E5" /> {/* Indigo member */}
      <circle cx="18" cy="6" r="1.5" fill="#3B82F6" /> {/* Blue member */}
      <circle cx="11" cy="21" r="1.8" fill="#10B981" /> {/* Emerald member */}
      <circle cx="18" cy="18" r="1.5" fill="#F59E0B" /> {/* Amber member */}
      
      {/* Central glowing core representing the synthesized wisdom */}
      <circle cx="12" cy="12" r="2.5" fill="url(#council-core-grad)" />
      <circle cx="12" cy="12" r="1" fill="#FFFFFF" />

      {/* Gradients */}
      <defs>
        <linearGradient id="council-orbit-grad" x1="2" y1="3" x2="18" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4F46E5" />
          <stop offset="0.5" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#EC4899" />
        </linearGradient>
        <linearGradient id="council-inner-grad" x1="7" y1="7" x2="16.5" y2="17" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id="council-core-grad" x1="9.5" y1="9.5" x2="14.5" y2="14.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
    </svg>
  );
}
