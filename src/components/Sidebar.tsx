import { Button } from "@/components/ui/button";
import { type Category, navItems } from "@/types/types";

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
                        size="icon"
                        onClick={() => setCategory(item.name)}
                    >
                        <item.icon className="h-5 w-5" />
                        <span className="sr-only">{item.label}</span>
                    </Button>
                ))}
            </nav>
        </aside>
    );
};