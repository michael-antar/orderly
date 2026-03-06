import { memo, type ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface TagBadgeProps {
  name: string;
  children?: ReactNode;
  className?: string;
}

// Simple hashing function to generate a color from a string
const stringToHslColor = (str: string, s: number, l: number): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, ${s}%, ${l}%)`;
};

/**
 * Read-only tag with a hash-generated background and text color based on the name.
 */
export const TagBadge = memo(({ name, children, className }: TagBadgeProps) => {
  const backgroundColor = stringToHslColor(name, 30, 80); // Lighter background
  const textColor = stringToHslColor(name, 80, 25); // Darker text

  return (
    <Badge style={{ backgroundColor, color: textColor }} className={cn('border-transparent', className)}>
      {name}
      {children}
    </Badge>
  );
});

TagBadge.displayName = 'TagBadge';
