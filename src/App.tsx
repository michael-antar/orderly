import { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';

import { Toaster } from '@/components/ui/sonner';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CategoryView } from './components/CategoryView';

import { ensureUserCategories } from './lib/categoryUtils';
import { type CategoryDefinition } from './types/types';

function App() {
    const { user, authLoading } = useAuth();

    const [categories, setCategories] = useState<CategoryDefinition[]>([]);
    const [activeCategoryId, setActiveCategoryId] = useState<string | null>(
        null,
    );
    const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Manage sidebar visibility on small screens

    // Fetch/Seed categories when user loads
    useEffect(() => {
        const initCategories = async () => {
            if (!user) return;

            try {
                setIsCategoriesLoading(true);

                const userCats = await ensureUserCategories();
                setCategories(userCats);

                // TODO: Do I need to see if user has one already selected?
                if (userCats.length > 0) {
                    setActiveCategoryId(userCats[0].id);
                }
            } catch (error) {
                console.error('Failed to load categories:', error);
            } finally {
                setIsCategoriesLoading(false);
            }
        };

        if (!authLoading) {
            initCategories();
        }
    }, [user, authLoading]);

    // Full screen loader (Only for initial auth check)
    // TODO: Later switch with full UI skeleton for better transition
    // TODO: Is this even necessary? Shouldn't a user always be found + sidebar/catview should always show at least skeleton?
    if (authLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <p className="text-lg text-muted-foreground">
                    Loading application...
                </p>
            </div>
        );
    }

    const handleCategorySelect = (id: string) => {
        setActiveCategoryId(id);
        setIsSidebarOpen(false);
    };

    return (
        <div className="flex flex-col h-screen bg-background">
            <Toaster />

            <Header
                activeCategoryName={
                    categories.find((c) => c.id === activeCategoryId)?.name
                }
                onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar
                    categories={categories}
                    activeCategoryId={activeCategoryId}
                    isSidebarOpen={isSidebarOpen}
                    isLoading={isCategoriesLoading}
                    onCategorySelect={handleCategorySelect}
                    onClose={() => setIsSidebarOpen(false)}
                />

                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-10 md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                <main className="flex-1 overflow-y-auto">
                    {activeCategoryId ? (
                        <CategoryView categoryId={activeCategoryId} />
                    ) : (
                        /* Empty State if something goes wrong or no cats */
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            {isCategoriesLoading
                                ? 'Loading Categories...'
                                : 'No categories found.'}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default App;
