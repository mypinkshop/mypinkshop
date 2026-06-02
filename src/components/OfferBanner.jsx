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
          description: 'FREE SHIPPING ON ORDERS ABOVE ₹999 • EXTRA 10% OFF ON FIRST ORDER'
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

  return (
    <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 text-white py-2.5 text-center text-sm font-medium tracking-wide">
      <div className="max-w-7xl mx-auto px-4 flex justify-center items-center gap-2 flex-wrap">
        <span>✨</span>
        <span>{offer.description}</span>
        <span>✨</span>
      </div>
    </div>
  );
}

export default OfferBanner;
