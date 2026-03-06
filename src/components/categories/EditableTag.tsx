import { useState } from 'react';

import { Input } from '@/components/ui/input';
import { type Tag } from '@/types/types';

import { TagBadge } from './TagBadge';

export interface EditableTagProps {
  tag: Tag;
  onRename: (tag: Tag, newName: string) => void;
}

/**
 * Inline-editable tag badge.
 * Automatically swaps between a static badge and an auto-expanding text input.
 */
export const EditableTag = ({ tag, onRename }: EditableTagProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(tag.name);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (name.trim() && name.trim() !== tag.name) {
        onRename(tag, name.trim());
      }
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setName(tag.name); // Revert changes
    }
  };

  const handleBlur = () => {
    // Save on blur if the name has changed
    if (name.trim() && name.trim() !== tag.name) {
      onRename(tag, name.trim());
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="relative">
        {/* Hidden span used to calculate the width of the input */}
        <span className="invisible col-start-1 row-start-1 whitespace-pre px-2.5 py-0.5 text-xs font-medium min-w-[4rem]">
          {name || ' '}
        </span>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          autoFocus
          className="col-start-1 row-start-1 w-full h-auto min-w-[4rem] rounded-md border-transparent bg-background px-2.5 py-0.5 text-xs font-medium transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        />
      </div>
    );
  }

  return (
    <div onClick={() => setIsEditing(true)} className="cursor-pointer">
      <TagBadge name={tag.name} />
    </div>
  );
};
