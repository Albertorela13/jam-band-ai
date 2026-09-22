import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import PersonaEditor from "./pages/PersonaEditor.tsx";
import RunTest from "./pages/RunTest.tsx";
import TestDetail from "./pages/TestDetail.tsx";
import HistoryPage from "./pages/HistoryPage.tsx";

const App = () => (
  <TooltipProvider>
    <Sonner />
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/persona/new" element={<PersonaEditor />} />
          <Route path="/persona/:id" element={<PersonaEditor />} />
          <Route path="/test/new" element={<RunTest />} />
          <Route path="/test/:id" element={<TestDetail />} />
          <Route path="/history" element={<HistoryPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
