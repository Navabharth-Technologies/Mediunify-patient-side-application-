import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext();

const ORDERS_STORAGE_KEY = '@unnathi_pharmacy_orders';
const ADDRESS_STORAGE_KEY = '@unnathi_delivery_address';

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
  const [cart, setCart] = useState([]);
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

  // Load saved orders & address on mount
  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      const storedOrders = await AsyncStorage.getItem(ORDERS_STORAGE_KEY);
      if (storedOrders) {
        setOrders(JSON.parse(storedOrders));
      }

      const storedAddress = await AsyncStorage.getItem(ADDRESS_STORAGE_KEY);
      if (storedAddress) {
        setSelectedAddress(JSON.parse(storedAddress));
      }
    } catch (e) {
      console.log('Error loading saved cart data:', e);
    }
  };

  // ==========================================
  // ADD TO CART
  // ==========================================
  const addToCart = (product, quantityToAdd = 1) => {
    setCart((previousCart) => {
      const existingItem = previousCart.find((item) => item.id === product.id);

      if (existingItem) {
        return previousCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + quantityToAdd,
              }
            : item
        );
      }

      return [
        ...previousCart,
        {
          ...product,
          quantity: quantityToAdd,
        },
      ];
    });
  };

  // ==========================================
  // INCREASE QUANTITY
  // ==========================================
  const increaseQuantity = (productId) => {
    setCart((previousCart) =>
      previousCart.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  };

  // ==========================================
  // DECREASE QUANTITY
  // ==========================================
  const decreaseQuantity = (productId) => {
    setCart((previousCart) =>
      previousCart
        .map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // ==========================================
  // REMOVE ITEM
  // ==========================================
  const removeFromCart = (productId) => {
    setCart((previousCart) =>
      previousCart.filter((item) => item.id !== productId)
    );
  };

  // ==========================================
  // CLEAR CART
  // ==========================================
  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
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
  // TOTALS & COUNTS
  // ==========================================
  const cartCount = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  const subtotal = useMemo(() => {
    return cart.reduce(
      (total, item) => total + Number(item.price || 0) * item.quantity,
      0
    );
  }, [cart]);

  const mrpTotal = useMemo(() => {
    return cart.reduce(
      (total, item) => total + Number(item.mrp || item.oldPrice || item.price || 0) * item.quantity,
      0
    );
  }, [cart]);

  const productSavings = useMemo(() => {
    return Math.max(0, mrpTotal - subtotal);
  }, [mrpTotal, subtotal]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountPercent) {
      return Math.round((subtotal * appliedCoupon.discountPercent) / 100);
    }
    if (appliedCoupon.discountAmount) {
      return Math.min(subtotal, appliedCoupon.discountAmount);
    }
    return 0;
  }, [appliedCoupon, subtotal]);

  const deliveryFee = useMemo(() => {
    if (cart.length === 0) return 0;
    if (appliedCoupon?.freeDelivery) return 0;
    return subtotal >= 499 ? 0 : 40;
  }, [cart.length, appliedCoupon, subtotal]);

  const packagingFee = cart.length > 0 ? 5 : 0;

  const finalTotal = useMemo(() => {
    if (cart.length === 0) return 0;
    return Math.max(0, subtotal - discountAmount + deliveryFee + packagingFee);
  }, [cart.length, subtotal, discountAmount, deliveryFee, packagingFee]);

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
        cart,
        cartItems: cart, // alias
        setCart,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        cartTotal: subtotal,
        subtotal,
        mrpTotal,
        productSavings,
        discountAmount,
        deliveryFee,
        packagingFee,
        finalTotal,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
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