import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import HeroBanner from '../components/HeroBanner';
import DealsGrid from '../components/DealsGrid';
import CategoryStrip from '../components/CategoryStrip';
import SignInBanner from '../components/SignInBanner';

const Homepage = () => {
  const [heroBanner, setHeroBanner] = useState(null);
  const [deals, setDeals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 YAHAN DATA FETCH HOGA — ADMIN PANEL SE JO ADD KIYA
  useEffect(() => {
    const fetchHomepageData = async () => {
      try {
        // Sab kuch ek saath fetch karo
        const [banner, dealsData, categoriesData] = await Promise.all([
          api.getHeroBanner(),
          api.getDeals(),
          api.getCategories(),
        ]);

        setHeroBanner(banner);
        setDeals(dealsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching homepage data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomepageData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-pink-500 text-xl">Loading MyPinkShop... 🌸</div>
      </div>
    );
  }

  return (
    <div className="homepage">
      {/* Sign in banner — ye bhi admin se aa sakta hai */}
      <SignInBanner />

      {/* Hero banner — JO ADMIN NE ADD KIYA */}
      {heroBanner && <HeroBanner data={heroBanner} />}

      {/* Categories strip */}
      <CategoryStrip categories={categories} />

      {/* Deals grid — JO ADMIN NE ADD KIYE */}
      <DealsGrid deals={deals} />
    </div>
  );
};

export default Homepage;
