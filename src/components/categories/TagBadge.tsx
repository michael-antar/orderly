import { memo, type ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface TagBadgeProps {
  name: string;
  children?: ReactNode;
  className?: string;
}

// Derive a stable hue (0–360) from a tag name for OKLCH color generation
const nameToHue = (name: string): number => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
};

/**
 * Read-only tag with a hue-derived color that automatically adapts to light/dark
 * mode via the `.tag-badge` CSS class defined in index.css.
 */
export const TagBadge = memo(({ name, children, className }: TagBadgeProps) => {
  const hue = nameToHue(name);

  return (
    <Badge
      style={{ '--tag-hue': hue } as React.CSSProperties}
      className={cn('tag-badge border-transparent', className)}
    >
      {name}
      {children}
    </Badge>
  );
});

TagBadge.displayName = 'TagBadge';
