import { useState } from 'react';

import { Input } from '@/components/ui/input';
import { TagBadge } from '@/components/TagBadge';

import { type Tag } from '@/types/types';

type EditableTagProps = {
    tag: Tag;
    onRename: (tag: Tag, newName: string) => void;
};

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

    if (isEditing) {
        return (
            <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => setIsEditing(false)}
                autoFocus
                className="h-8"
            />
        );
    }

    return (
        <div onClick={() => setIsEditing(true)} className="cursor-pointer">
            <TagBadge name={tag.name} />
        </div>
    );
};
