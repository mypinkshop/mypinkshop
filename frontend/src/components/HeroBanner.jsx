import React from 'react';

const HeroBanner = ({ data }) => {
  // data admin se aayega: { title, subtitle, imageUrl, ctaLink }
  
  return (
    <div 
      className="hero-banner mx-4 my-6 rounded-3xl overflow-hidden shadow-lg"
      style={{ 
        backgroundImage: `url(${data.imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="bg-gradient-to-r from-black/50 to-transparent p-8 md:p-12">
        <div className="text-white max-w-lg">
          <h2 className="text-3xl md:text-5xl font-bold mb-3">
            {data.title}
          </h2>
          <p className="text-xl md:text-2xl mb-2">
            {data.subtitle}
          </p>
          {data.cashback && (
            <p className="text-sm bg-pink-500 inline-block px-3 py-1 rounded-full mb-4">
              💳 {data.cashback}
            </p>
          )}
          <a 
            href={data.ctaLink || '/shop'}
            className="inline-block bg-pink-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-pink-600 transition"
          >
            Shop now →
          </a>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
