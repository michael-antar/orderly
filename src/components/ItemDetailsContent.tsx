import { Star } from 'lucide-react';

import { TagBadge } from './TagBadge';
import { Badge } from './ui/badge';

import type {
    Item,
    FieldDefinition,
    ItemPropertyValue,
    LocationValue,
    CategoryDefinition,
} from '@/types/types';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
});

type ItemDetailsContentProps = {
    item: Item;
    categoryDef: CategoryDefinition;
};

export const ItemDetailsContent = ({
    item,
    categoryDef,
}: ItemDetailsContentProps) => {
    // Format dynamic value based on their type
    const renderPropertyValue = (
        field: FieldDefinition,
        value: ItemPropertyValue,
    ) => {
        if (value === null || value === undefined || value === '') {
            return (
                <span className="text-muted-foreground italic text-sm">
                    Empty
                </span>
            );
        }

        switch (field.type) {
            case 'boolean':
                return value ? 'Yes' : 'No';

            case 'location': {
                const loc = value as LocationValue;
                return (
                    <div className="flex flex-col gap-1">
                        <span>{loc.address}</span>
                        {/* TODO: Add Map Link or Mini-Map here */}
                        {loc.coordinates && (
                            <span className="text-xs text-muted-foreground">
                                {loc.coordinates.lat.toFixed(4)},{' '}
                                {loc.coordinates.lng.toFixed(4)}
                            </span>
                        )}
                    </div>
                );
            }

            case 'select':
            case 'number':
            case 'string':
            default:
                return String(value);
        }
    };

    const formattedDate = dateFormatter.format(new Date(item.created_at));

    // TODO: Improve this formatting
    return (
        <>
            {/* General Item Information */}
            <div>
                {/* Item Title */}
                <h2 className="text-3xl font-bold break-words overflow-hidden">
                    {item.name}
                </h2>

                {/* Ranked/Backlog Badge */}
                <Badge
                    variant={item.status === 'ranked' ? 'default' : 'secondary'}
                >
                    {item.status === 'ranked' ? 'Ranked List' : 'Backlog'}
                </Badge>

                {/* Elo */}
                {item.status === 'ranked' && item.rating !== null && (
                    <div className="flex items-center gap-1.5 text-amber-500 font-semibold">
                        <Star className="h-4 w-4 fill-current" />
                        <span>{Math.round(item.rating)}</span>
                        <span className="text-muted-foreground text-sm font-normal ml-1">
                            ELO
                        </span>
                    </div>
                )}

                {/* Timestamp */}
                <p className="text-sm text-muted-foreground">
                    {`Created: ${formattedDate}`}
                </p>

                {/* Item Description */}
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
            <div className="grid gap-6 sm:grid-cols-2">
                {categoryDef.field_definitions.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase">
                            {field.label}
                        </h4>
                        <div className="text-sm font-medium">
                            {renderPropertyValue(
                                field,
                                item.properties[field.key],
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};
