import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "./components/layout";
import HomePage from "./pages/HomePage";
import CharacterPage from "./pages/CharacterPage";
import VisualizationPage from "./pages/VisualizationPage";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-space">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/character/:id" element={<CharacterPage />} />
            <Route path="/visualization" element={<VisualizationPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
