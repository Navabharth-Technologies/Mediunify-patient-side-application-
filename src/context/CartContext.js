import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext();

const ORDERS_STORAGE_KEY = '@unnathi_pharmacy_orders';
const ADDRESS_STORAGE_KEY = '@unnathi_delivery_address';
const PHARMACY_CART_KEY = '@unnathi_pharmacy_cart';
const LAB_CART_KEY = '@unnathi_lab_cart';

const DEFAULT_ORDERS = [
  {
    id: 'UNC10245',
    date: '25 Aug 2026, 03:30 PM',
    status: 'Confirmed',
    paymentMethod: 'UPI (PhonePe)',
    paymentStatus: 'Paid',
    total: 315,
    subtotal: 275,
    deliveryFee: 40,
    items: [
      { id: '1', name: 'Paracetamol 500mg', price: 35, quantity: 2 },
      { id: '2', name: 'Vitamin C 500mg', price: 120, quantity: 1 },
      { id: '5', name: 'Antiseptic Liquid', price: 85, quantity: 1 },
    ],
    address: {
      name: 'Ramesh Kumar',
      phone: '9876543210',
      addressLine: 'Flat 402, Green Valley Apartments, Kuvempunagar',
      city: 'Mysore',
      state: 'Karnataka',
      pincode: '570023',
    },
    deliverySlot: 'Express Delivery (30-45 mins)',
  },
  {
    id: 'UNC10187',
    date: '18 Aug 2026, 11:15 AM',
    status: 'Delivered',
    paymentMethod: 'Cash on Delivery',
    paymentStatus: 'Paid on Delivery',
    total: 540,
    subtotal: 540,
    deliveryFee: 0,
    items: [
      { id: '3', name: 'Multivitamin Tablets', price: 199, quantity: 1 },
      { id: '7', name: 'First Aid Kit', price: 399, quantity: 1 },
    ],
    address: {
      name: 'Ramesh Kumar',
      phone: '9876543210',
      addressLine: 'No. 45, 3rd Cross, Vijayanagar 2nd Stage',
      city: 'Mysore',
      state: 'Karnataka',
      pincode: '570017',
    },
    deliverySlot: 'Standard Delivery',
  },
];

export const CartProvider = ({ children }) => {
  // Separate carts for Pharmacy and Lab tests
  const [pharmacyCart, setPharmacyCart] = useState([]);
  const [labCart, setLabCart] = useState([]);

  const [orders, setOrders] = useState(DEFAULT_ORDERS);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState({
    name: 'User',
    phone: '9876543210',
    addressLine: 'No. 24, 5th Cross, Kuvempunagar',
    city: 'Mysore',
    state: 'Karnataka',
    pincode: '570023',
    tag: 'Home',
  });

  // Load saved data on mount
  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      const storedOrders = await AsyncStorage.getItem(ORDERS_STORAGE_KEY);
      if (storedOrders) setOrders(JSON.parse(storedOrders));

      const storedAddress = await AsyncStorage.getItem(ADDRESS_STORAGE_KEY);
      if (storedAddress) setSelectedAddress(JSON.parse(storedAddress));

      const storedPharm = await AsyncStorage.getItem(PHARMACY_CART_KEY);
      if (storedPharm) setPharmacyCart(JSON.parse(storedPharm));

      const storedLab = await AsyncStorage.getItem(LAB_CART_KEY);
      if (storedLab) setLabCart(JSON.parse(storedLab));
    } catch (e) {
      console.log('Error loading saved cart data:', e);
    }
  };

  // Save carts when changed
  useEffect(() => {
    AsyncStorage.setItem(PHARMACY_CART_KEY, JSON.stringify(pharmacyCart)).catch(() => {});
  }, [pharmacyCart]);

  useEffect(() => {
    AsyncStorage.setItem(LAB_CART_KEY, JSON.stringify(labCart)).catch(() => {});
  }, [labCart]);

  // Helper to determine if an item is a lab test
  const isLabItem = (item, forcedType) => {
    if (forcedType === 'lab') return true;
    if (forcedType === 'pharmacy') return false;
    return (
      item.itemType === 'diagnostic' ||
      item.itemType === 'lab' ||
      item.category === 'Diagnostic Scan' ||
      item.category === 'Lab Test' ||
      item.category === 'Radiology' ||
      item.isLabTest === true ||
      item.labId !== undefined
    );
  };

  // ==========================================
  // ADD TO CART (AUTOMATIC CART ROUTING)
  // ==========================================
  const addToCart = (product, quantityToAdd = 1, forcedType = null) => {
    if (isLabItem(product, forcedType)) {
      setLabCart((prev) => {
        const existing = prev.find((item) => item.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + quantityToAdd } : item
          );
        }
        return [...prev, { ...product, quantity: quantityToAdd, cartType: 'lab' }];
      });
    } else {
      setPharmacyCart((prev) => {
        const existing = prev.find((item) => item.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + quantityToAdd } : item
          );
        }
        return [...prev, { ...product, quantity: quantityToAdd, cartType: 'pharmacy' }];
      });
    }
  };

  // Dedicated Lab Test Add
  const addLabTestToCart = (test, quantity = 1) => {
    addToCart(test, quantity, 'lab');
  };

  // Dedicated Pharmacy Add
  const addPharmacyProductToCart = (product, quantity = 1) => {
    addToCart(product, quantity, 'pharmacy');
  };

  // ==========================================
  // INCREASE QUANTITY
  // ==========================================
  const increaseQuantity = (productId, cartType = null) => {
    if (cartType === 'lab' || labCart.some((i) => i.id === productId)) {
      setLabCart((prev) =>
        prev.map((item) => (item.id === productId ? { ...item, quantity: item.quantity + 1 } : item))
      );
    } else {
      setPharmacyCart((prev) =>
        prev.map((item) => (item.id === productId ? { ...item, quantity: item.quantity + 1 } : item))
      );
    }
  };

  // ==========================================
  // DECREASE QUANTITY
  // ==========================================
  const decreaseQuantity = (productId, cartType = null) => {
    if (cartType === 'lab' || labCart.some((i) => i.id === productId)) {
      setLabCart((prev) =>
        prev
          .map((item) => (item.id === productId ? { ...item, quantity: item.quantity - 1 } : item))
          .filter((item) => item.quantity > 0)
      );
    } else {
      setPharmacyCart((prev) =>
        prev
          .map((item) => (item.id === productId ? { ...item, quantity: item.quantity - 1 } : item))
          .filter((item) => item.quantity > 0)
      );
    }
  };

  // ==========================================
  // REMOVE ITEM
  // ==========================================
  const removeFromCart = (productId, cartType = null) => {
    if (cartType === 'lab') {
      setLabCart((prev) => prev.filter((item) => item.id !== productId));
    } else if (cartType === 'pharmacy') {
      setPharmacyCart((prev) => prev.filter((item) => item.id !== productId));
    } else {
      setPharmacyCart((prev) => prev.filter((item) => item.id !== productId));
      setLabCart((prev) => prev.filter((item) => item.id !== productId));
    }
  };

  // ==========================================
  // CLEAR CART
  // ==========================================
  const clearCart = (cartType = null) => {
    if (cartType === 'pharmacy') {
      setPharmacyCart([]);
    } else if (cartType === 'lab') {
      setLabCart([]);
    } else {
      setPharmacyCart([]);
      setLabCart([]);
      setAppliedCoupon(null);
    }
  };

  // ==========================================
  // COUPON HANDLING
  // ==========================================
  const applyCoupon = (code) => {
    const cleanCode = (code || '').trim().toUpperCase();
    if (cleanCode === 'UNNATHI20') {
      const coupon = {
        code: 'UNNATHI20',
        discountPercent: 20,
        description: '20% OFF on all orders',
      };
      setAppliedCoupon(coupon);
      return { success: true, message: '20% discount coupon applied!' };
    }
    if (cleanCode === 'HEALTH50') {
      const coupon = {
        code: 'HEALTH50',
        discountAmount: 50,
        description: 'Flat ₹50 OFF',
      };
      setAppliedCoupon(coupon);
      return { success: true, message: 'Flat ₹50 discount applied!' };
    }
    if (cleanCode === 'FIRSTFREE') {
      const coupon = {
        code: 'FIRSTFREE',
        freeDelivery: true,
        description: 'Free Express Delivery',
      };
      setAppliedCoupon(coupon);
      return { success: true, message: 'Free delivery applied!' };
    }
    return { success: false, message: 'Invalid promo code. Try UNNATHI20 or HEALTH50' };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  // ==========================================
  // PHARMACY TOTALS
  // ==========================================
  const pharmacyCartCount = useMemo(() => {
    return pharmacyCart.reduce((total, item) => total + item.quantity, 0);
  }, [pharmacyCart]);

  const pharmacySubtotal = useMemo(() => {
    return pharmacyCart.reduce(
      (total, item) => total + Number(item.price || 0) * item.quantity,
      0
    );
  }, [pharmacyCart]);

  const pharmacyMrpTotal = useMemo(() => {
    return pharmacyCart.reduce(
      (total, item) => total + Number(item.mrp || item.oldPrice || item.price || 0) * item.quantity,
      0
    );
  }, [pharmacyCart]);

  const pharmacySavings = useMemo(() => {
    return Math.max(0, pharmacyMrpTotal - pharmacySubtotal);
  }, [pharmacyMrpTotal, pharmacySubtotal]);

  const pharmacyDiscountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountPercent) {
      return Math.round((pharmacySubtotal * appliedCoupon.discountPercent) / 100);
    }
    if (appliedCoupon.discountAmount) {
      return Math.min(pharmacySubtotal, appliedCoupon.discountAmount);
    }
    return 0;
  }, [appliedCoupon, pharmacySubtotal]);

  const pharmacyDeliveryFee = useMemo(() => {
    if (pharmacyCart.length === 0) return 0;
    if (appliedCoupon?.freeDelivery) return 0;
    return pharmacySubtotal >= 499 ? 0 : 40;
  }, [pharmacyCart.length, appliedCoupon, pharmacySubtotal]);

  const pharmacyPackagingFee = pharmacyCart.length > 0 ? 5 : 0;

  const pharmacyFinalTotal = useMemo(() => {
    if (pharmacyCart.length === 0) return 0;
    return Math.max(0, pharmacySubtotal - pharmacyDiscountAmount + pharmacyDeliveryFee + pharmacyPackagingFee);
  }, [pharmacyCart.length, pharmacySubtotal, pharmacyDiscountAmount, pharmacyDeliveryFee, pharmacyPackagingFee]);

  // ==========================================
  // LAB TESTS TOTALS
  // ==========================================
  const labCartCount = useMemo(() => {
    return labCart.reduce((total, item) => total + item.quantity, 0);
  }, [labCart]);

  const labSubtotal = useMemo(() => {
    return labCart.reduce(
      (total, item) => total + Number(item.price || 0) * item.quantity,
      0
    );
  }, [labCart]);

  const labMrpTotal = useMemo(() => {
    return labCart.reduce(
      (total, item) => total + Number(item.mrp || item.oldPrice || item.price || 0) * item.quantity,
      0
    );
  }, [labCart]);

  const labSavings = useMemo(() => {
    return Math.max(0, labMrpTotal - labSubtotal);
  }, [labMrpTotal, labSubtotal]);

  const labDiscountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountPercent) {
      return Math.round((labSubtotal * appliedCoupon.discountPercent) / 100);
    }
    if (appliedCoupon.discountAmount) {
      return Math.min(labSubtotal, appliedCoupon.discountAmount);
    }
    return 0;
  }, [appliedCoupon, labSubtotal]);

  const labSampleFee = labCart.length > 0 ? 0 : 0; // Free home sample collection

  const labFinalTotal = useMemo(() => {
    if (labCart.length === 0) return 0;
    return Math.max(0, labSubtotal - labDiscountAmount + labSampleFee);
  }, [labCart.length, labSubtotal, labDiscountAmount, labSampleFee]);

  // Overall combined totals (for global headers if needed)
  const totalCartCount = pharmacyCartCount + labCartCount;

  // ==========================================
  // ORDERS MANAGEMENT
  // ==========================================
  const addOrder = async (newOrder) => {
    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    try {
      await AsyncStorage.setItem(
        ORDERS_STORAGE_KEY,
        JSON.stringify(updatedOrders)
      );
    } catch (e) {
      console.log('Error saving order to storage:', e);
    }
  };

  const updateAddress = async (address) => {
    setSelectedAddress(address);
    try {
      await AsyncStorage.setItem(
        ADDRESS_STORAGE_KEY,
        JSON.stringify(address)
      );
    } catch (e) {
      console.log('Error saving address:', e);
    }
  };

  return (
    <CartContext.Provider
      value={{
        // Separate Carts
        pharmacyCart,
        labCart,
        cart: pharmacyCart, // fallback for legacy components
        cartItems: pharmacyCart,

        // Add actions
        addToCart,
        addLabTestToCart,
        addPharmacyProductToCart,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart,
        clearCart,

        // Counts
        totalCartCount,
        cartCount: pharmacyCartCount,
        pharmacyCartCount,
        labCartCount,

        // Pharmacy Pricing
        subtotal: pharmacySubtotal,
        mrpTotal: pharmacyMrpTotal,
        productSavings: pharmacySavings,
        discountAmount: pharmacyDiscountAmount,
        deliveryFee: pharmacyDeliveryFee,
        packagingFee: pharmacyPackagingFee,
        finalTotal: pharmacyFinalTotal,
        pharmacySubtotal,
        pharmacyMrpTotal,
        pharmacySavings,
        pharmacyDiscountAmount,
        pharmacyDeliveryFee,
        pharmacyPackagingFee,
        pharmacyFinalTotal,

        // Lab Pricing
        labSubtotal,
        labMrpTotal,
        labSavings,
        labDiscountAmount,
        labSampleFee,
        labFinalTotal,

        // Coupons
        appliedCoupon,
        applyCoupon,
        removeCoupon,

        // Address & Orders
        selectedAddress,
        updateAddress,
        orders,
        addOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return context;
};