import { AuthProvider } from "@/shared/providers/auth";
import { Outlet } from "react-router";

const RootLayout = () => {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
};

export default RootLayout;
