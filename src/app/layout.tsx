import { Outfit } from 'next/font/google';
import './globals.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { UserProvider } from '@/context/authContext';
import { ToastContainer } from 'react-toastify';
import { Metadata } from 'next';


const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vertix",
  description: "Mobile website for Vetinarians and Pet Owners",
  icons: {
    icon: "/logo.png"
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (

    <html lang="en">
      <body className={`${outfit.className} `} suppressHydrationWarning>
        <UserProvider>
          <ThemeProvider>
            <ToastContainer
              position="bottom-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored" 
            />
            <SidebarProvider>{children}</SidebarProvider>
          </ThemeProvider>
        </UserProvider>
      </body>
    </html>
  );
}
