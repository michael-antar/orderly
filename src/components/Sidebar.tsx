import { Button } from "@/components/ui/button";
// import { cn } from "@/lib/utils";
import { Utensils, Film, Tv, Book, Music } from 'lucide-react';
import { type Category } from "@/types/types";

const navItems = [
    { name: 'restaurants', icon: Utensils, label: 'Restaurants' },
    { name: 'movies', icon: Film, label: 'Movies' },
    { name: 'tv-shows', icon: Tv, label: 'TV Shows' },
    { name: 'books', icon: Book, label: 'Books' },
    { name: 'music', icon: Music, label: 'Music' },
] as const;

type SidebarProps = {
    activeCategory: Category;
    setCategory: (category: Category) => void;
}

export const Sidebar = ({ activeCategory, setCategory } : SidebarProps) => {
    return (
        <aside className="w-14 p-2 border-r border-border">
            <nav className="flex flex-col gap-2">
                {navItems.map((item) => (
                    <Button
                        key={item.name}
                        variant={activeCategory === item.name ? 'secondary' : 'ghost'}
                        className="justify-start gap-3"
                        onClick={() => setCategory(item.name)}
                    >
                        <item.icon className="h-5 w-5" />
                        {/* <span>{item.label}</span> */}
                    </Button>
                ))}
            </nav>
        </aside>
    );
};