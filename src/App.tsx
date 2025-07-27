import { Header } from './components/Header';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { authLoading } = useAuth();

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
    <div className="min-h-screen bg-background">
      <Header />
    </div>
  );
};

export default App;