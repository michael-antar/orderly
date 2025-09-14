import { getCategoryDetails } from '@/lib/utils';

import { TagBadge } from './TagBadge';

import { type CombinedItem } from '@/types/types';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
});

type ItemDetailsContentProps = {
    item: CombinedItem;
};

export const ItemDetailsContent = ({ item }: ItemDetailsContentProps) => {
    const details = getCategoryDetails(item);

    const formattedDate = dateFormatter.format(new Date(item.created_at));

    return (
        <>
            {/* General Item Information */}
            <div>
                <h2 className="text-3xl font-bold break-words overflow-hidden">
                    {item.name}
                </h2>
                <p className="text-muted-foreground capitalize">
                    {item.status === 'ranked'
                        ? `Elo: ${item.rating}`
                        : 'Backlog'}
                </p>
                <p className="text-sm text-muted-foreground">
                    {`Created: ${formattedDate}`}
                </p>

                {item.description && (
                    <p className="mt-4 text-sm whitespace-pre-wrap break-words">
                        {item.description}
                    </p>
                )}
            </div>

            {/* Tags Section */}
            {item.tags && item.tags.length > 0 && (
                <div className="mt-6 space-y-2 border-t pt-4">
                    <h4 className="font-semibold text-muted-foreground text-sm">
                        Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {item.tags.map((tag) => (
                            <TagBadge key={tag.id} name={tag.name} />
                        ))}
                    </div>
                </div>
            )}

            {/* Category Specific Details */}
            <div className="mt-6 space-y-2 border-t pt-4">
                {details.map(([key, value]) => (
                    <div
                        key={key}
                        className="flex justify-between items-start gap-4 text-sm"
                    >
                        <span className="font-semibold text-muted-foreground">
                            {key}
                        </span>
                        <span className="text-foreground text-right min-w-0 break-words">
                            {value}
                        </span>
                    </div>
                ))}
            </div>
        </>
    );
};
