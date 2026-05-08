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
import { Suspense } from 'react';
import Image from 'next/image';


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

function GlobalLoader() {
  return (
    <div className="flex items-center justify-center flex-col gap-1.5 h-[100vh] w-[100vw] bg-primary">
      <Image src={"/Group 1261153125.png"} alt='' width={47} height={42} />
      <span className='text-white font-bold'>V e t Q u a r k</span>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  console.log("Ahmad 2 test");
  return (

    <html lang="pt-BR">
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
                <SidebarProvider>
                  <Suspense fallback={<GlobalLoader />}>
                    {children}
                  </Suspense>
                </SidebarProvider>
              </ThemeProvider>
            </UserProvider>
          </I18nProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
