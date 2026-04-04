import { Check, Clipboard, Share2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { getCategoryDetails } from '@/lib/utils';
import type { CategoryDefinition, FieldDefinition, Item } from '@/types/types';

export interface ShareListDialogProps {
  categoryDef: CategoryDefinition;
  items: Item[];
  activeTab: 'ranked' | 'backlog';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const MEDAL_EMOJIS: Record<number, string> = {
  0: '🥇',
  1: '🥈',
  2: '🥉',
};

function formatShareText(
  items: Item[],
  categoryName: string,
  activeTab: 'ranked' | 'backlog',
  options: {
    limit: number | null;
    showRatings: boolean;
    showDetails: boolean;
    showTags: boolean;
    fieldDefinitions: FieldDefinition[];
  },
): string {
  const { limit, showRatings, showDetails, showTags, fieldDefinitions } = options;
  const displayItems = limit ? items.slice(0, limit) : items;

  const isRanked = activeTab === 'ranked';
  const headerLabel = limit ? `Top ${displayItems.length}` : `${displayItems.length} items`;
  const tabLabel = isRanked ? 'Ranked' : 'Backlog';

  const lines: string[] = [];

  lines.push(`${categoryName} — ${tabLabel} (${headerLabel})`);
  lines.push('');

  for (let i = 0; i < displayItems.length; i++) {
    const item = displayItems[i];
    const medal = isRanked ? MEDAL_EMOJIS[i] : undefined;
    const prefix = medal ? `${medal} ` : `${String(i + 1).padStart(String(displayItems.length).length, ' ')}. `;

    let line = `${prefix}${item.name}`;

    if (showRatings && isRanked && item.rating !== null) {
      line += ` (${item.rating})`;
    }

    const details: string[] = [];

    if (showDetails) {
      const categoryDetails = getCategoryDetails(item, fieldDefinitions);
      details.push(...categoryDetails.map(([, val]) => val));
    }

    if (showTags && item.tags && item.tags.length > 0) {
      details.push(item.tags.map((t) => `#${t.name}`).join(' '));
    }

    if (details.length > 0) {
      line += ` — ${details.join(', ')}`;
    }

    lines.push(line);
  }

  lines.push('');
  lines.push('Made with Orderly');

  return lines.join('\n');
}

export const ShareListDialog = ({ categoryDef, items, activeTab, open: openProp, onOpenChange: onOpenChangeProp }: ShareListDialogProps) => {
  const isControlled = openProp !== undefined;
  const [isOpenInternal, setIsOpenInternal] = useState(false);
  const isOpen = isControlled ? openProp : isOpenInternal;

  const setIsOpen = (open: boolean) => {
    if (isControlled) onOpenChangeProp?.(open);
    else setIsOpenInternal(open);
  };
  const [copied, setCopied] = useState(false);

  // Options
  const [limitEnabled, setLimitEnabled] = useState(false);
  const [limitValue, setLimitValue] = useState(10);
  const [showRatings, setShowRatings] = useState(true);
  const [showDetails, setShowDetails] = useState(true);
  const [showTags, setShowTags] = useState(false);

  // Reset copied state when dialog opens/closes
  useEffect(() => {
    if (isOpen) setCopied(false);
  }, [isOpen]);

  const previewText = useMemo(
    () =>
      formatShareText(items, categoryDef.name, activeTab, {
        limit: limitEnabled ? limitValue : null,
        showRatings,
        showDetails,
        showTags,
        fieldDefinitions: categoryDef.field_definitions,
      }),
    [
      items,
      categoryDef.name,
      categoryDef.field_definitions,
      activeTab,
      limitEnabled,
      limitValue,
      showRatings,
      showDetails,
      showTags,
    ],
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(previewText);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  }, [previewText]);

  const displayCount = limitEnabled ? Math.min(limitValue, items.length) : items.length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" disabled={items.length === 0}>
            <Share2 className="h-4 w-4" />
            <span className="sr-only">Share List</span>
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share List</DialogTitle>
          <DialogDescription>Copy your {activeTab} list as formatted text to share anywhere.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Limit option */}
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="limit-toggle" className="text-sm font-medium">
              Limit to top items
            </Label>
            <div className="flex items-center gap-2">
              {limitEnabled && (
                <Input
                  type="number"
                  min={1}
                  max={items.length}
                  value={limitValue}
                  onChange={(e) => setLimitValue(Math.max(1, Math.min(items.length, Number(e.target.value) || 1)))}
                  className="w-18 h-8 text-sm"
                />
              )}
              <Switch id="limit-toggle" checked={limitEnabled} onCheckedChange={setLimitEnabled} />
            </div>
          </div>

          {/* Rating toggle — only for ranked tab */}
          {activeTab === 'ranked' && (
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="ratings-toggle" className="text-sm font-medium">
                Show ratings
              </Label>
              <Switch id="ratings-toggle" checked={showRatings} onCheckedChange={setShowRatings} />
            </div>
          )}

          {/* Details toggle */}
          {categoryDef.field_definitions.length > 0 && (
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="details-toggle" className="text-sm font-medium">
                Show details
              </Label>
              <Switch id="details-toggle" checked={showDetails} onCheckedChange={setShowDetails} />
            </div>
          )}

          {/* Tags toggle */}
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="tags-toggle" className="text-sm font-medium">
              Show tags
            </Label>
            <Switch id="tags-toggle" checked={showTags} onCheckedChange={setShowTags} />
          </div>

          <Separator />

          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Preview ({displayCount} {displayCount === 1 ? 'item' : 'items'})
            </Label>
            <ScrollArea className="h-56 rounded-md border bg-muted/30 p-3">
              <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed">{previewText}</pre>
            </ScrollArea>
          </div>

          {/* Copy button */}
          <Button onClick={handleCopy} className="w-full" disabled={items.length === 0}>
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Clipboard className="h-4 w-4" />
                Copy to Clipboard
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
