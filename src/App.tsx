import { Header } from './components/Header';
import { useAuth } from './contexts/AuthContext';

// This component contains the actual app UI
function App() {
  const { authLoading } = useAuth();

  // Show a full-screen, centered loading message
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-lg text-gray-600">Loading application...</p>
      </div>
    );
  }

  // Once loaded, render the real app
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Orderly</h1>
        <p className="text-gray-700">Log and rank your experiences.</p>
      </main>
    </div>
  );
};

export default App;