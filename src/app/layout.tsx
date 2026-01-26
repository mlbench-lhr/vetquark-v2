import { Outfit } from 'next/font/google';
import './globals.css';
import 'react-phone-input-2/lib/style.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { UserProvider } from '@/context/authContext';
import { ToastContainer } from 'react-toastify';
import { Metadata } from 'next';
import ReduxProvider from '@/store/ReduxProvider';
import I18nProvider from '@/i18n/I18nProvider';


const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VetQuark",
  description: "Mobile website for Veterinarians and Pet Owners",
  icons: {
    icon: "/Group 1261153125.png"
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
        <ReduxProvider>
          <I18nProvider>
            <UserProvider>
              <ThemeProvider>
                <ToastContainer
                  position="top-right"
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
          </I18nProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
