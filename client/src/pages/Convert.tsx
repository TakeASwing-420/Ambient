import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { FC } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Features from '@/components/Features';
import WorkflowContainer from '@/components/WorkflowContainer';

const Convert: FC = () => {
    useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Header />
      
      <main className="max-w-7xl mx-auto mt-20 px-4 sm:px-6 lg:px-8 py-8 bg-purple-50 min-h-screen convert">
        {/* Hero */}
        <section className="text-center mb-12">
          <h2 className="font-poppins font-bold text-3xl md:text-4xl mb-3">Transform Your <span className="purpleTitle">Videos</span> and <span className="purpleTitle">Images</span></h2>
          <p className="text-gray-600 max-w-2xl mx-auto subText">
            Upload your videos and/or images and let our AI analyze it to generate the perfect lofi soundtrack, creating a new video with custom music.
          </p>
        </section>
        
        {/* Main Workflow Container */}
        <WorkflowContainer />
      </main>
      
      <Footer />
    </>
  );
};

export default Convert;
