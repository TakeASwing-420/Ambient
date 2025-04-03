import { FC } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Features from '@/components/Features';
import WorkflowContainer from '@/components/WorkflowContainer';

const Home: FC = () => {
  return (
    <>
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-100 min-h-screen">
        {/* Hero */}
        <section className="text-center mb-12">
          <h2 className="font-poppins font-bold text-3xl md:text-4xl mb-3">Transform Your Music into LoFi</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload your track, adjust the parameters, and let our AI transform it into a chill lofi masterpiece.
          </p>
        </section>
        
        {/* Main Workflow Container */}
        <WorkflowContainer />
        
        {/* Features */}
        <Features />
      </main>
      
      <Footer />
    </>
  );
};

export default Home;
