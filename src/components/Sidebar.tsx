import { Button } from "@/components/ui/button";
import { type Category, navItems } from "@/types/types";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

type SidebarProps = {
    isSidebarOpen: boolean;
    activeCategory: Category;
    onCategorySelect: (category: Category) => void;
    onClose: () => void;
}

export const Sidebar = ({ isSidebarOpen, activeCategory, onCategorySelect, onClose } : SidebarProps) => {
    return (
        <aside className={cn(
            "fixed top-0 left-0 h-full w-64 bg-background px-4 pb-4 pt-[65px] border-r border-border transition-transform duration-300 ease-in-out z-20",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full",

            "md:static md:w-14 md:p-2 md:translate-x-0"
        )}>
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 left-4 md:hidden"
                onClick={onClose}   
            >
                <X className="h-6 w-6" />
                <span className="sr-only">Close sidebar</span>
            </Button>

            <nav className="flex flex-col gap-2">
                {navItems.map((item) => (
                    <Button
                        key={item.name}
                        variant={activeCategory === item.name ? 'secondary' : 'ghost'}
                        className="justify-start md:w-10 md:h-10 md:justify-center"
                        onClick={() => onCategorySelect(item.name)}
                    >
                        <item.icon className="h-5 w-5" />
                        <span className="md:hidden ml-3">{item.label}</span>
                    </Button>
                ))}
            </nav>
        </aside>
    );
};