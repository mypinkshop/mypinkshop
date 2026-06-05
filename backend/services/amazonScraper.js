const axios = require('axios');
const cheerio = require('cheerio');

class AmazonScraper {
  async scrapeProduct(url) {
    try {
      // Validate Amazon URL
      if (!url.includes('amazon.in') && !url.includes('amazon.com')) {
        throw new Error('Please enter a valid Amazon India URL');
      }
      
      // Fetch HTML
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const html = response.data;
      const $ = cheerio.load(html);
      
      // Extract product details
      const product = {
        name: $('#productTitle').text().trim(),
        brand: $('#bylineInfo').text().trim() || $('#brand').text().trim(),
        price: this.extractPrice($),
        originalPrice: this.extractOriginalPrice($),
        images: this.extractImages($),
        description: this.extractDescription($),
        keyFeatures: this.extractFeatures($),
        rating: this.extractRating($),
        reviewCount: this.extractReviewCount($),
        category: await this.detectCategory($, url)
      };
      
      return product;
      
    } catch (error) {
      console.error('Scraping error:', error);
      throw new Error('Failed to fetch product details. Please check the URL.');
    }
  }
  
  extractPrice($) {
    // Try multiple price selectors
    let price = $('#priceblock_ourprice').text();
    if (!price) price = $('#priceblock_dealprice').text();
    if (!price) price = $('.a-price-whole').first().text();
    
    const match = price.match(/[\d,]+/);
    if (match) {
      return parseInt(match[0].replace(/,/g, ''));
    }
    return 0;
  }
  
  extractOriginalPrice($) {
    let price = $('#priceblock_wasprice').text();
    if (!price) price = $('.a-text-strike').first().text();
    
    const match = price.match(/[\d,]+/);
    if (match) {
      return parseInt(match[0].replace(/,/g, ''));
    }
    return 0;
  }
  
  extractImages($) {
    const images = [];
    
    // Main image
    const mainImage = $('#imgTagWrapperId img').attr('src');
    if (mainImage) images.push(mainImage);
    
    // Thumbnails
    $('.imgTagWrapperId img, .a-dynamic-image').each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-old-hires');
      if (src && !images.includes(src) && src.includes('.jpg')) {
        images.push(src);
      }
    });
    
    return images.slice(0, 5);
  }
  
  extractDescription($) {
    let description = $('#productDescription').text().trim();
    if (!description) description = $('.a-unordered-list .a-list-item').text().trim();
    return description || 'No description available';
  }
  
  extractFeatures($) {
    const features = [];
    $('#feature-bullets .a-list-item').each((i, el) => {
      const text = $(el).text().trim();
      if (text) features.push(text);
    });
    return features;
  }
  
  extractRating($) {
    const rating = $('.a-icon-alt').first().text();
    const match = rating.match(/[\d.]+/);
    if (match) return parseFloat(match[0]);
    return 4.0;
  }
  
  extractReviewCount($) {
    const reviews = $('#acrCustomerReviewText').text();
    const match = reviews.match(/[\d,]+/);
    if (match) return parseInt(match[0].replace(/,/g, ''));
    return 0;
  }
  
  async detectCategory($, url) {
    // Detect from breadcrumb
    const breadcrumb = $('.a-link-normal.a-color-tertiary').text().toLowerCase();
    if (breadcrumb.includes('skin') || breadcrumb.includes('face')) return 'Skincare';
    if (breadcrumb.includes('makeup') || breadcrumb.includes('lipstick')) return 'Makeup';
    if (breadcrumb.includes('hair')) return 'Hair';
    if (breadcrumb.includes('cloth') || breadcrumb.includes('dress')) return 'Clothing';
    if (breadcrumb.includes('accessories')) return 'Accessories';
    return 'Skincare';
  }
}

module.exports = new AmazonScraper();
