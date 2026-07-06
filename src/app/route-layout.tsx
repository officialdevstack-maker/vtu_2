import { AuthProvider, useAuth } from "@/shared/providers/auth";
import { toWhatsAppLink } from "@/shared/utils";
import { useDocumentBranding } from "@/shared/branding";
import { generalService } from "@/features/admin/pages/generalService";
import { useQuery } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { MessageCircle } from "lucide-react";
import { Outlet } from "react-router";

// Keeps document.title / meta description tallied with Settings > General,
// site-wide, on every route (including logged-out pages).
function DocumentBranding() {
  useDocumentBranding();
  return null;
}

// Site-wide WhatsApp support bubble — only shown once logged in (the
// number itself is admin-configured, General::app_phone, and the endpoint
// backing it requires auth).
function WhatsAppSupportButton() {
  const { user } = useAuth();
  const generalQuery = useQuery({
    queryKey: ["general-settings"],
    queryFn: () => generalService.get(),
    enabled: Boolean(user),
    staleTime: Infinity,
  });

  if (!user || !generalQuery.data?.app_phone) return null;

  return (
    <a
      href={toWhatsAppLink(generalQuery.data.app_phone)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      title="Chat on WhatsApp"
      className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-slate-900/20 transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#25D366]/30 sm:bottom-6 sm:right-6"
    >
      <MessageCircle className="h-5 w-5" />
    </a>
  );
}

const RootLayout = () => {
  return (
    <>
      <DocumentBranding />
      <AuthProvider>
        <Outlet />
        <WhatsAppSupportButton />
      </AuthProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </>
  );
};

export default RootLayout;
