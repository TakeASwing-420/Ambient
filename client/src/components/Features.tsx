import { FC } from 'react';

const Features: FC = () => {
  return (
    <section className="mt-16">
      <h2 className="font-poppins font-bold text-2xl text-center mb-8">Why Choose Lofify?</h2>
      
      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 100 20 10 10 0 000-20z"></path>
              <path d="M12 8a4 4 0 100 8 4 4 0 000-8z"></path>
              <path d="M12 17a1 1 0 100 2 1 1 0 000-2z"></path>
            </svg>
          </div>
          <h3 className="font-poppins font-semibold text-lg mb-2">AI Video Analysis</h3>
          <p className="text-gray-600">
            Our AI analyzes your video content and generates custom lofi music that perfectly matches the mood and atmosphere.
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="w-12 h-12 bg-secondary bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"></path>
            </svg>
          </div>
          <h3 className="font-poppins font-semibold text-lg mb-2">Automatic Processing</h3>
          <p className="text-gray-600">
            Simply upload your video and let our AI handle everything - from analysis to music generation to final video creation.
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="w-12 h-12 bg-accent bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0110 0v4"></path>
            </svg>
          </div>
          <h3 className="font-poppins font-semibold text-lg mb-2">Privacy First</h3>
          <p className="text-gray-600">
            Your videos stay private. We process your content securely and never store them longer than needed.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Features;
