import { useEffect, useState, useCallback } from 'react';
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Manage sidebar visibility on mobile

    const refreshCategories = useCallback(async () => {
        if (!user) return;

        try {
            const userCats = await ensureUserCategories();
            setCategories(userCats);

            setActiveCategoryId((currentId) => {
                // No ID selected yet, pick first one
                if (!currentId && userCats.length > 0) {
                    return userCats[0].id;
                }

                // Currently selected ID deleted, pick new first one
                if (currentId && !userCats.find((c) => c.id === currentId)) {
                    return userCats.length > 0 ? userCats[0].id : null;
                }

                return currentId;
            });
        } catch (error) {
            console.error('Failed to reload categories:', error);
        }
    }, [user]);

    // Initial load
    useEffect(() => {
        const init = async () => {
            setIsCategoriesLoading(true);
            await refreshCategories();
            setIsCategoriesLoading(false);
        };
        if (!authLoading) init();
    }, [user, authLoading, refreshCategories]);

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
                    onCategoriesChange={refreshCategories}
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
                        <CategoryView
                            key={activeCategoryId}
                            categoryId={activeCategoryId}
                        />
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
