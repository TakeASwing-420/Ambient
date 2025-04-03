import { FC } from 'react';
import { Link } from 'wouter';

const Header: FC = () => {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18V5l12-2v13"></path>
                  <circle cx="6" cy="18" r="3"></circle>
                  <circle cx="18" cy="16" r="3"></circle>
                </svg>
              </div>
              <h1 className="ml-3 font-poppins font-bold text-2xl text-gray-800">LoFify</h1>
            </div>
          </Link>
          <div>
            <Link href="/">
              <span className="font-medium text-primary hover:text-primary/90 transition-colors cursor-pointer">
                About
              </span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
