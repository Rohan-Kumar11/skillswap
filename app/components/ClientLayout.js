"use client";

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  
  // Pages that should NOT show the sidebar (fullscreen pages)
  const noSidebarPages = [
    '/',
    '/auth/callback',
  ];
  
  // Check if current page starts with these paths
  const noSidebarPrefixes = [
    '/onboarding',
  ];
  
  const shouldShowSidebar = 
    !noSidebarPages.includes(pathname) && 
    !noSidebarPrefixes.some(prefix => pathname.startsWith(prefix));

  return (
    <>
      {shouldShowSidebar && <Sidebar />}
      {children}
    </>
  );
}