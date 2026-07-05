import { AuthProvider } from "@/shared/providers/auth";
import { queryClient } from "@/shared/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { MessageCircle } from "lucide-react";
import { Outlet } from "react-router";
import { Link } from "react-router-dom";

const RootLayout = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Link
          to="/support"
          aria-label="Open live chat"
          title="Live chat"
          className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#111827] text-white shadow-lg shadow-slate-900/20 transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#111827]/20 sm:bottom-6 sm:right-6"
        >
          <MessageCircle className="h-5 w-5" />
        </Link>
      </AuthProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};

export default RootLayout;
