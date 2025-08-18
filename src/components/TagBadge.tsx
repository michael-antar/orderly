import { Badge } from '@/components/ui/badge';

type TagBadgeProps = {
    name: string;
};

// Simple hashing function to generate a color from a string
const stringToHslColor = (str: string, s: number, l: number): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    return `hsl(${h}, ${s}%, ${l}%)`;
};

export const TagBadge = ({ name }: TagBadgeProps) => {
    const backgroundColor = stringToHslColor(name, 30, 80); // Lighter background
    const textColor = stringToHslColor(name, 80, 25); // Darker text

    return (
        <Badge
            style={{ backgroundColor, color: textColor }}
            className="border-transparent"
        >
            {name}
        </Badge>
    );
};
