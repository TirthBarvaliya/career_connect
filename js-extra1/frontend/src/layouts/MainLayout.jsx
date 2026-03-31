import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/navigation/Navbar";
import Footer from "../components/navigation/Footer";

const MainLayout = () => {
  const { pathname } = useLocation();
  const hideFooter = pathname.startsWith("/interview");

  return (
    <div className="app-shell noise-bg min-h-screen">
      {/* Global Fixed Liquid Glass Blobs */}
      <div
        aria-hidden
        className="pointer-events-none fixed -left-[10%] -top-[10%] h-[50vh] w-[50vw] rounded-full bg-brand-indigo/20 blur-[120px] transform-gpu dark:bg-brand-indigo/30"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed top-[40%] -right-[10%] h-[50vh] w-[40vw] rounded-full bg-brand-cyan/20 blur-[120px] transform-gpu dark:bg-brand-cyan/20"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -bottom-[10%] left-[20%] h-[50vh] w-[50vw] rounded-full bg-brand-purple/20 blur-[120px] transform-gpu dark:bg-brand-purple/25"
      />
      <Navbar />
      <main>
        <Outlet />
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
};

export default MainLayout;
