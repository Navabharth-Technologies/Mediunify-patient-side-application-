import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_PHARMACY_STORE = {
  id: 'store-apollo-kuvempu',
  name: 'Apollo Pharmacy - Kuvempunagar',
  locality: 'Kuvempunagar',
  address: '#45, 8th Cross, Complex Road, Kuvempunagar, Mysore - 570023',
  deliveryTime: '15-25 mins',
  phone: '+91 821 2548901',
  partnerTier: 'Platinum Partner',
};

const CartContext = createContext();

const ORDERS_STORAGE_KEY = '@unnathi_pharmacy_orders';
const ADDRESS_STORAGE_KEY = '@unnathi_delivery_address';
const PHARMACY_CART_KEY = '@unnathi_pharmacy_cart';
const LAB_CART_KEY = '@unnathi_lab_cart';
const SELECTED_STORE_KEY = '@unnathi_selected_pharmacy_store';

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
  const [selectedPharmacyStore, setSelectedPharmacyStoreState] = useState(DEFAULT_PHARMACY_STORE);
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
      const storedGenOrders = await AsyncStorage.getItem('@orders');
      let combinedOrders = [];
      if (storedOrders) {
        try { combinedOrders = JSON.parse(storedOrders); } catch (e) {}
      }
      if (storedGenOrders) {
        try {
          const parsedGen = JSON.parse(storedGenOrders);
          if (Array.isArray(parsedGen)) {
            const map = new Map();
            [...combinedOrders, ...parsedGen].forEach((o) => {
              if (o && o.id) map.set(o.id, o);
            });
            combinedOrders = Array.from(map.values());
          }
        } catch (e) {}
      }
      if (combinedOrders.length > 0) {
        setOrders(combinedOrders);
      }

      const storedAddress = await AsyncStorage.getItem(ADDRESS_STORAGE_KEY);
      if (storedAddress) setSelectedAddress(JSON.parse(storedAddress));

      const storedStore = await AsyncStorage.getItem(SELECTED_STORE_KEY);
      if (storedStore) {
        setSelectedPharmacyStoreState(JSON.parse(storedStore));
      }

      const storedPharm = await AsyncStorage.getItem(PHARMACY_CART_KEY);
      if (storedPharm) setPharmacyCart(JSON.parse(storedPharm));

      const storedLab = await AsyncStorage.getItem(LAB_CART_KEY);
      if (storedLab) setLabCart(JSON.parse(storedLab));
    } catch (e) {
      console.log('Error loading saved cart data:', e);
    }
  };

  const setSelectedPharmacyStore = async (store) => {
    setSelectedPharmacyStoreState(store);
    try {
      await AsyncStorage.setItem(SELECTED_STORE_KEY, JSON.stringify(store));
    } catch (e) {
      console.log('Error saving selected store:', e);
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
  const addToCart = (product, quantityToAdd = 1, forcedType = null, storeOverride = null) => {
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
      const targetStore = storeOverride || selectedPharmacyStore || {
        id: product.storeId || 'store-apollo-kuvempu',
        name: product.storeName || 'Apollo Pharmacy - Kuvempunagar',
        locality: product.storeArea || 'Kuvempunagar',
        address: product.storeAddress || '#45, 8th Cross, Complex Road, Kuvempunagar, Mysore - 570023',
        deliveryTime: product.deliveryTime || '15-25 mins',
        phone: product.storePhone || '+91 821 2548901',
        partnerTier: product.partnerTier || 'Platinum Partner',
      };

      const productWithStore = {
        ...product,
        storeId: product.storeId || targetStore.id || 'store-apollo-kuvempu',
        storeName: product.storeName || targetStore.name || 'Apollo Pharmacy - Kuvempunagar',
        storeArea: product.storeArea || targetStore.locality || 'Kuvempunagar',
        storeAddress: product.storeAddress || targetStore.address || '#45, 8th Cross, Complex Road, Kuvempunagar, Mysore - 570023',
        deliveryTime: product.deliveryTime || targetStore.deliveryTime || '15-25 mins',
        storePhone: product.storePhone || targetStore.phone || '+91 821 2548901',
        partnerTier: product.partnerTier || targetStore.partnerTier || 'Platinum Partner',
        cartType: 'pharmacy',
      };

      setPharmacyCart((prev) => {
        const existing = prev.find(
          (item) => item.id === product.id && (item.storeId === productWithStore.storeId || (!item.storeId && !productWithStore.storeId))
        );
        if (existing) {
          return prev.map((item) =>
            item.id === product.id && (item.storeId === productWithStore.storeId || (!item.storeId && !productWithStore.storeId))
              ? { ...item, quantity: item.quantity + quantityToAdd }
              : item
          );
        }
        return [...prev, { ...productWithStore, quantity: quantityToAdd }];
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
  const increaseQuantity = (productId, cartType = null, storeId = null) => {
    if (cartType === 'lab' || (labCart.some((i) => i.id === productId) && cartType !== 'pharmacy')) {
      setLabCart((prev) =>
        prev.map((item) => (item.id === productId ? { ...item, quantity: item.quantity + 1 } : item))
      );
    } else {
      setPharmacyCart((prev) =>
        prev.map((item) =>
          item.id === productId && (!storeId || item.storeId === storeId)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    }
  };

  // ==========================================
  // DECREASE QUANTITY
  // ==========================================
  const decreaseQuantity = (productId, cartType = null, storeId = null) => {
    if (cartType === 'lab' || (labCart.some((i) => i.id === productId) && cartType !== 'pharmacy')) {
      setLabCart((prev) =>
        prev
          .map((item) => (item.id === productId ? { ...item, quantity: item.quantity - 1 } : item))
          .filter((item) => item.quantity > 0)
      );
    } else {
      setPharmacyCart((prev) =>
        prev
          .map((item) =>
            item.id === productId && (!storeId || item.storeId === storeId)
              ? { ...item, quantity: item.quantity - 1 }
              : item
          )
          .filter((item) => item.quantity > 0)
      );
    }
  };

  // ==========================================
  // REMOVE ITEM
  // ==========================================
  const removeFromCart = (productId, cartType = null, storeId = null) => {
    if (cartType === 'lab') {
      setLabCart((prev) => prev.filter((item) => item.id !== productId));
    } else if (cartType === 'pharmacy') {
      setPharmacyCart((prev) =>
        prev.filter((item) => !(item.id === productId && (!storeId || item.storeId === storeId)))
      );
    } else {
      setPharmacyCart((prev) =>
        prev.filter((item) => !(item.id === productId && (!storeId || item.storeId === storeId)))
      );
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

  const labSampleFee = 0; // Free doorstep / center sample collection

  const labFinalTotal = useMemo(() => {
    if (labCart.length === 0) return 0;
    return Math.max(0, labSubtotal - labDiscountAmount + labSampleFee);
  }, [labCart.length, labSubtotal, labDiscountAmount, labSampleFee]);

  // ==========================================
  // MULTI-HOSPITAL SEPARATE CARTS FOR RADIOLOGY
  // ==========================================
  const groupedHospitalCarts = useMemo(() => {
    const map = new Map();
    labCart.forEach((item) => {
      const hospitalKey = item.labId || item.labName || 'default-hospital';
      if (!map.has(hospitalKey)) {
        map.set(hospitalKey, {
          labId: item.labId || 'default-hospital',
          labName: item.labName || 'MediUnify Diagnostic & Imaging Center',
          labArea: item.labArea || 'Kuvempunagar, Mysore',
          labAddress: item.labAddress || 'Plot 14, Kuvempunagar, Mysore',
          labPhone: item.labPhone || '+91 821 245 8890',
          accreditation: item.labAccreditation || 'NABL & NABH Accredited',
          items: [],
          itemsCount: 0,
          subtotal: 0,
          mrpTotal: 0,
          savings: 0,
          hasRadiologyScans: false,
        });
      }

      const hospCart = map.get(hospitalKey);
      hospCart.items.push(item);
      hospCart.itemsCount += item.quantity;
      hospCart.subtotal += Number(item.price || 0) * item.quantity;
      hospCart.mrpTotal += Number(item.mrp || item.oldPrice || item.price || 0) * item.quantity;
      hospCart.savings = Math.max(0, hospCart.mrpTotal - hospCart.subtotal);
      if (
        item.category === 'Radiology' ||
        item.category === 'Diagnostic Scan' ||
        item.modality ||
        item.modalityCode ||
        item.itemType === 'diagnostic' ||
        (item.categoryLabel &&
          !item.categoryLabel.toLowerCase().includes('blood') &&
          !item.categoryLabel.toLowerCase().includes('urine'))
      ) {
        hospCart.hasRadiologyScans = true;
      }
    });

    return Array.from(map.values());
  }, [labCart]);

  const clearHospitalCart = (labId) => {
    setLabCart((prev) =>
      prev.filter((item) => (item.labId || item.labName || 'default-hospital') !== labId)
    );
  };

  // ==========================================
  // MULTI-STORE SEPARATE CARTS FOR PHARMACY MEDICINES
  // ==========================================
  const groupedPharmacyCarts = useMemo(() => {
    const map = new Map();
    pharmacyCart.forEach((item) => {
      const storeKey = item.storeId || item.storeName || 'store-apollo-kuvempu';
      if (!map.has(storeKey)) {
        map.set(storeKey, {
          storeId: item.storeId || 'store-apollo-kuvempu',
          storeName: item.storeName || 'Apollo Pharmacy - Kuvempunagar',
          storeArea: item.storeArea || 'Kuvempunagar, Mysore',
          storeAddress: item.storeAddress || '#45, 8th Cross, Complex Road, Kuvempunagar, Mysore - 570023',
          storePhone: item.storePhone || '+91 821 2548901',
          deliveryTime: item.deliveryTime || '15-25 mins',
          partnerTier: item.partnerTier || 'Platinum Partner',
          items: [],
          itemsCount: 0,
          subtotal: 0,
          mrpTotal: 0,
          savings: 0,
          deliveryFee: 25,
          packagingFee: 5,
          requiresPrescription: false,
        });
      }

      const storeCart = map.get(storeKey);
      storeCart.items.push(item);
      storeCart.itemsCount += item.quantity;
      storeCart.subtotal += Number(item.price || 0) * item.quantity;
      storeCart.mrpTotal += Number(item.mrp || item.oldPrice || item.price || 0) * item.quantity;
      storeCart.savings = Math.max(0, storeCart.mrpTotal - storeCart.subtotal);
      if (storeCart.subtotal >= 299) {
        storeCart.deliveryFee = 0;
      }
      if (item.requiresPrescription || item.category === 'Medicines' || item.category === 'Antibiotics') {
        storeCart.requiresPrescription = true;
      }
    });

    return Array.from(map.values()).map((s) => ({
      ...s,
      finalTotal: Math.max(0, s.subtotal + s.deliveryFee + s.packagingFee),
    }));
  }, [pharmacyCart]);

  const clearPharmacyStoreCart = (storeId) => {
    setPharmacyCart((prev) =>
      prev.filter((item) => (item.storeId || item.storeName || 'store-apollo-kuvempu') !== storeId)
    );
  };

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
      await AsyncStorage.setItem(
        '@orders',
        JSON.stringify(updatedOrders)
      );
    } catch (e) {
      console.log('Error saving order to storage:', e);
    }
    // Background sync to central server
    try {
      const { syncActiveUser } = require('../services/dataSyncService');
      await syncActiveUser();
    } catch (err) {}
  };

  const requestProductReturn = async (orderId, returnPayload) => {
    const updatedOrders = orders.map((order) => {
      if (order.id === orderId) {
        return {
          ...order,
          status: 'Return Requested',
          returnDetails: {
            ...returnPayload,
            requestedAt: new Date().toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            pickupStatus: 'Pickup Scheduled (Within 24-48 hrs)',
            pickupSlot: 'Tomorrow, 10:00 AM - 02:00 PM',
          },
        };
      }
      return order;
    });

    setOrders(updatedOrders);
    try {
      await AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders));
    } catch (e) {
      console.log('Error saving returned order:', e);
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

        // Pharmacy Pricing & Multi-Store Carts
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
        groupedPharmacyCarts,
        clearPharmacyStoreCart,

        // Lab Pricing & Multi-Hospital Carts
        labSubtotal,
        labMrpTotal,
        labSavings,
        labDiscountAmount,
        labSampleFee,
        labFinalTotal,
        groupedHospitalCarts,
        clearHospitalCart,

        // Coupons
        appliedCoupon,
        applyCoupon,
        removeCoupon,

        // Selected Pharmacy Store
        selectedPharmacyStore,
        setSelectedPharmacyStore,
        setPharmacyStore: setSelectedPharmacyStore,
        pharmacyStores: [],

        // Address & Orders
        selectedAddress,
        updateAddress,
        orders,
        addOrder,
        requestProductReturn,
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