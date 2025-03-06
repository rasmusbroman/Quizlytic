'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };
  
  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold text-primary mr-8">
            Quizlytic
          </Link>
          
          <nav className="flex space-x-1">
            <Link 
              href="/"
              className={`px-3 py-1 rounded-t-md ${isActive('/') 
                ? 'bg-primary text-white' 
                : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Dashboard
            </Link>
            <Link 
              href="/create"
              className={`px-3 py-1 rounded-t-md ${isActive('/create') 
                ? 'bg-primary text-white' 
                : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Create Quiz
            </Link>
            <Link 
              href="/results"
              className={`px-3 py-1 rounded-t-md ${isActive('/results') 
                ? 'bg-primary text-white' 
                : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Results
            </Link>
            <Link 
              href="/join"
              className={`px-3 py-1 rounded-t-md ${isActive('/join') 
                ? 'bg-primary text-white' 
                : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Join
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}