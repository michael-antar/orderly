import { iconMap } from '@/lib/icons';

type Props = {
    name: string;
    className?: string;
};

/**
 * Renders the icon for the category based on the text stored in the DB
 */
export const DynamicIcon = ({ name, className }: Props) => {
    // Fallback to 'default' if the icon name isn't found
    const IconComponent = iconMap[name.toLowerCase()] || iconMap.default;
    return <IconComponent className={className} />;
};
