import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import MentorSetup from "./pages/MentorSetup";
import Repositories from "./pages/Repositories";
import RepositoryManagement from "./pages/RepositoryManagement";
import Chat from "./pages/Chat";
import StudentFeedback from "./pages/StudentFeedback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // 👇 Chatbase script runs once after the app mounts
  useEffect(() => {
    (function () {
      if (!window.chatbase || window.chatbase("getState") !== "initialized") {
        window.chatbase = (...args: any[]) => {
          if (!window.chatbase.q) window.chatbase.q = [];
          window.chatbase.q.push(args);
        };
        window.chatbase = new Proxy(window.chatbase, {
          get(target, prop) {
            if (prop === "q") return target.q;
            return (...args: any[]) => target(prop, ...args);
          },
        });
      }

      const onLoad = function () {
        const script = document.createElement("script");
        script.src = "https://www.chatbase.co/embed.min.js";
        script.id = "t6w7sjqxolyq31ai4uvkg9g811pzmge9"; // 🔹 Replace with your actual Chatbase Bot ID
        script.domain = "www.chatbase.co";
        document.body.appendChild(script);
      };

      if (document.readyState === "complete") {
        onLoad();
      } else {
        window.addEventListener("load", onLoad);
      }
    })();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="data-theme"
        defaultTheme="dark"
        themes={["light", "dark"]}
        enableSystem
        disableTransitionOnChange={false}
      >
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/mentor-setup" element={<MentorSetup />} />
            <Route path="/repositories" element={<Repositories />} />
            <Route
              path="/repository-management"
              element={<RepositoryManagement />}
            />
            <Route path="/chat" element={<Chat />} />
            <Route path="/feedback" element={<StudentFeedback />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
