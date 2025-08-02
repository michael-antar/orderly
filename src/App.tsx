import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CategoryView } from './components/CategoryView';
import { type Category } from './types/types';

function App() {
  const { authLoading } = useAuth();
  const [activeCategory, setActiveCategory] = useState<Category>('restaurant');

  // Show a full-screen, centered loading message
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-lg text-muted-foreground">Loading application...</p>
      </div>
    );
  }

  // Once loaded, render the real app
  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeCategory={activeCategory} setCategory={setActiveCategory} />
        <main className="flex-1 p-8 overflow-y-auto">
          <CategoryView category={activeCategory} />
        </main>
      </div>
    </div>
  );
};

export default App;