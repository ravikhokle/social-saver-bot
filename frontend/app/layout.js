import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata = {
    title: 'Social Saver Bot',
    description: 'Save and organize your social media links effortlessly',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <Navbar />
                <main className="main-content">
                    {children}
                </main>
            </body>
        </html>
    );
}
