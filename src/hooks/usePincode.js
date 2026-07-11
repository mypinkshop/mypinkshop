// src/hooks/usePincode.js

import { useState, useEffect } from 'react';
import { checkDelivery } from '../utils/shipping';

export const usePincode = (vendorPincode, weight = 0.5) => {
  const [pincode, setPincode] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkPincode = async (pincodeToCheck) => {
    if (!pincodeToCheck || pincodeToCheck.length !== 6) {
      setError('Please enter a valid 6-digit pincode');
      return;
    }

    setLoading(true);
    setError(null);
    setDeliveryStatus(null);

    try {
      const result = await checkDelivery(pincodeToCheck, vendorPincode, weight);
      
      if (result.success) {
        setDeliveryStatus({
          deliverable: result.deliverable,
          message: result.message,
          estimatedDelivery: result.estimatedDelivery
        });
      } else {
        setError(result.message || 'Failed to check delivery');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPincode('');
    setDeliveryStatus(null);
    setError(null);
    setLoading(false);
  };

  return {
    pincode,
    setPincode,
    deliveryStatus,
    loading,
    error,
    checkPincode,
    reset
  };
};
