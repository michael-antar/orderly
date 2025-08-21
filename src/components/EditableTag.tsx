import { useLayoutEffect, useRef, useState } from 'react';

// import { cn } from '@/lib/utils';

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
    const [inputWidth, setInputWidth] = useState(0);
    const spanRef = useRef<HTMLSpanElement>(null);

    // Measures the width of the hidden span and sets the input's width
    useLayoutEffect(() => {
        if (spanRef.current) {
            setInputWidth(spanRef.current.offsetWidth);
        }
    }, [name]);

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
                <span
                    ref={spanRef}
                    className="invisible absolute h-full whitespace-pre px-2.5 py-0.5 text-xs font-medium"
                >
                    {name || ' '}
                </span>
                <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    autoFocus
                    style={{ width: `${inputWidth + 8}px` }} // Add a little extra width
                    className="h-auto min-w-[4rem] rounded-md border-transparent bg-background px-2.5 py-0.5 text-xs font-medium transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
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
