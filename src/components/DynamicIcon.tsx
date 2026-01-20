import {
    Utensils,
    Film,
    Tv,
    Book,
    Music,
    MapPin,
    Star,
    Gamepad2,
    Footprints,
    Mountain,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Map of allowed icons
const iconMap: Record<string, LucideIcon> = {
    restaurant: Utensils,
    movie: Film,
    show: Tv,
    book: Book,
    album: Music,
    location: MapPin,
    hiking: Mountain,
    activity: Footprints,
    game: Gamepad2,
    default: Star,
};

type Props = {
    name: string;
    className?: string;
};

export const DynamicIcon = ({ name, className }: Props) => {
    // Fallback to 'default' if the icon name isn't found
    const IconComponent = iconMap[name.toLowerCase()] || iconMap.default;
    return <IconComponent className={className} />;
};
