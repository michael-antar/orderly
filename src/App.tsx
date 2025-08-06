import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';

import { Toaster } from '@/components/ui/sonner';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CategoryView } from './components/CategoryView';
import { type Category } from './types/types';

function App() {
  const { authLoading } = useAuth();
  const [activeCategory, setActiveCategory] = useState<Category>('restaurant');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Manage sidebar visibility on small screens

  // Show a full-screen, centered loading message
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-lg text-muted-foreground">Loading application...</p>
      </div>
    );
  }

  // 2. Function to handle category selection and close the mobile sidebar
  const handleCategorySelect = (category: Category) => {
    setActiveCategory(category);
    setIsSidebarOpen(false);
  };

  // Once loaded, render the real app
  return (
    <div className="flex flex-col h-screen bg-background">
      <Toaster />
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isSidebarOpen={isSidebarOpen}
          activeCategory={activeCategory}
          onCategorySelect={handleCategorySelect}
          onClose={() => setIsSidebarOpen(false)} 
        />
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-10 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        <main className="flex-1 p-8 overflow-y-auto">
          <CategoryView category={activeCategory} />
        </main>
      </div>
    </div>
  );
};

export default App;