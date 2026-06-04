import { useState, useEffect } from 'react';

function OfferBanner() {
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = 'https://api.mypinkshop.com';

  useEffect(() => {
    const fetchOffer = async () => {
      try {
        const response = await fetch(`${API_URL}/api/offers/active-offer`);
        const data = await response.json();
        setOffer(data);
      } catch (error) {
        console.error('Error fetching offer:', error);
        // Default offer if API fails
        setOffer({
          description: 'FREE SHIPPING ON ORDERS ABOVE ₹499 • EXTRA 10% OFF ON FIRST ORDER'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchOffer();
    // Refresh every 5 minutes
    const interval = setInterval(fetchOffer, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 text-white py-2.5 text-center text-sm font-medium">
        <div className="max-w-7xl mx-auto px-4">
          <span>Loading offers...</span>
        </div>
      </div>
    );
  }

  if (!offer) return null;

  // Split description into multiple offers for marquee
  const offers = offer.description.split('•').map(item => item.trim()).filter(item => item);

  return (
    <>
      {/* Desktop View - Static centered */}
      <div className="hidden md:block bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 text-white py-2.5 text-center text-sm font-medium tracking-wide">
        <div className="max-w-7xl mx-auto px-4 flex justify-center items-center gap-2 flex-wrap">
          <span>✨</span>
          <span>{offer.description}</span>
          <span>✨</span>
        </div>
      </div>

      {/* Mobile View - Left to Right Auto Scroll */}
      <div className="md:hidden bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 text-white py-2.5 overflow-hidden whitespace-nowrap">
        <div className="inline-flex items-center gap-6 px-4 animate-marquee">
          <span className="text-lg">✨</span>
          {offers.map((item, idx) => (
            <span key={idx} className="text-sm font-medium tracking-wide">
              • {item} •
            </span>
          ))}
          <span className="text-lg">✨</span>
          {/* Duplicate for seamless loop */}
          <span className="text-lg">✨</span>
          {offers.map((item, idx) => (
            <span key={`dup-${idx}`} className="text-sm font-medium tracking-wide">
              • {item} •
            </span>
          ))}
          <span className="text-lg">✨</span>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
          width: fit-content;
        }
        @media (max-width: 768px) {
          .animate-marquee {
            animation-duration: 15s;
          }
        }
      `}</style>
    </>
  );
}

export default OfferBanner;
