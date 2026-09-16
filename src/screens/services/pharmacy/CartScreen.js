import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showAlert } from '../../../utils/alert';
import { useCart } from '../../../context/CartContext';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { requestLocationPermissionWebSafe, getCurrentPositionWebSafe, reverseGeocodeWebSafe } from '../../../utils/locationHelper';
import pharmacyProducts from '../../../data/pharmacyProducts';
import WebFooter from '../../../components/web/WebFooter';

// PAYMENT CONSTANTS MATCHED TO CHECKOUT MODAL
const UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', icon: 'logo-google', color: '#4285F4' },
  { id: 'phonepe', name: 'PhonePe', icon: 'flash', color: '#5F259F' },
  { id: 'paytm', name: 'Paytm UPI', icon: 'wallet', color: '#00BAF2' },
  { id: 'bhim', name: 'BHIM UPI', icon: 'qr-code', color: '#00529C' },
  { id: 'cred', name: 'CRED Pay', icon: 'shield-checkmark', color: '#1A1A1A' },
];

const POPULAR_BANKS = [
  { id: 'hdfc', name: 'HDFC Bank' },
  { id: 'icici', name: 'ICICI Bank' },
  { id: 'sbi', name: 'State Bank of India' },
  { id: 'axis', name: 'Axis Bank' },
  { id: 'kotak', name: 'Kotak Mahindra' },
];

const PAYMENT_METHODS_CHECKOUT = [
  { id: 'UPI', label: 'UPI / Google Pay / PhonePe', icon: 'phone-portrait-outline', iconColor: '#7C3AED' },
  { id: 'CARD', label: 'Credit / Debit Card', icon: 'card-outline', iconColor: '#FF5252' },
  { id: 'NETBANKING', label: 'Net Banking', icon: 'business-outline', iconColor: '#0369A1' },
  { id: 'WALLET', label: 'Health Wallet Balance', icon: 'wallet-outline', iconColor: '#059669' },
  { id: 'COD', label: 'Cash on Delivery (Pay at Doorstep)', icon: 'cash-outline', iconColor: '#D97706' },
];

// CURATED TOP DEALS (Matching Sanofi top deals in reference image)
const TOP_DEALS = [
  {
    id: 'deal-1',
    name: 'Depura 60000 IU Vitamin D3 Oral Solution',
    packSize: 'Bottle of 5 ml oral solution',
    price: 100,
    mrp: 116.87,
    discount: '14% off',
    rating: 4.4,
    reviews: '2648',
    eta: 'Get by 7pm, Today',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300',
    brand: 'Sanofi',
    category: 'Vitamins & Minerals',
  },
  {
    id: 'deal-2',
    name: 'Enterogermina Probiotic Supplement | For Gut Health',
    packSize: 'Strip of 4 capsules',
    price: 172,
    mrp: 201.9,
    discount: '15% off',
    rating: 4.6,
    reviews: '1820',
    eta: 'Get by 7pm, Today',
    image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300',
    brand: 'Sanofi',
    category: 'Digestive Care',
  },
  {
    id: 'deal-3',
    name: 'Lactacyd Feminine Hygiene Wash',
    packSize: 'Bottle of 100 ml gentle wash',
    price: 327,
    mrp: 329,
    discount: '7% off',
    rating: 4.7,
    reviews: '721',
    eta: 'Get by 7pm, Today',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300',
    brand: 'Sanofi',
    category: 'Personal Care',
  },
  {
    id: 'deal-4',
    name: 'Combiflam Pain Relief Cream',
    packSize: 'Tube of 30 gm cream',
    price: 121,
    mrp: 131.25,
    discount: '8% off',
    rating: 4.5,
    reviews: '3410',
    eta: 'Get by 7pm, Today',
    image: 'https://images.unsplash.com/photo-1550572017-ed24058d844c?w=300',
    brand: 'Sanofi',
    category: 'Pain Relief',
  },
  {
    id: 'deal-5',
    name: 'Buscogast Hyoscine Butylbromide Tablets',
    packSize: 'Strip of 10 tablets',
    price: 43.5,
    mrp: 45.78,
    discount: '5% off',
    rating: 4.3,
    reviews: '237',
    eta: 'Get by 7pm, Today',
    image: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=300',
    brand: 'Sanofi',
    category: 'Stomach Care',
  },
];

// LAST MINUTE BUYS
const LAST_MINUTE_BUYS = [
  {
    id: 'quick-1',
    name: 'Vicks Vaporub 25ml Relief Balm',
    packSize: 'Jar of 25 ml',
    price: 85,
    mrp: 95,
    discount: '11% off',
    rating: 4.8,
    eta: 'Express 30 mins',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300',
    brand: 'Procter & Gamble',
    category: 'Cold & Cough',
  },
  {
    id: 'quick-2',
    name: 'Hansaplast Waterproof Bandages (Pack of 20)',
    packSize: 'Box of 20 strips',
    price: 65,
    mrp: 75,
    discount: '13% off',
    rating: 4.7,
    eta: 'Express 30 mins',
    image: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=300',
    brand: 'Hansaplast',
    category: 'First Aid',
  },
  {
    id: 'quick-3',
    name: 'Dettol Instant Hand Sanitizer 50ml',
    packSize: 'Bottle of 50 ml',
    price: 25,
    mrp: 30,
    discount: '17% off',
    rating: 4.9,
    eta: 'Express 30 mins',
    image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300',
    brand: 'Reckitt',
    category: 'Hygiene',
  },
  {
    id: 'quick-4',
    name: 'Dolo 650mg Paracetamol Tablets',
    packSize: 'Strip of 15 tablets',
    price: 31,
    mrp: 34.5,
    discount: '10% off',
    rating: 4.9,
    eta: 'Express 30 mins',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300',
    brand: 'Micro Labs',
    category: 'Medicines',
  },
];

// DEFAULT MOCKUP ITEMS (Matches the user's uploaded screenshot)
const DEFAULT_MOCKUP_ITEMS = [
  {
    id: 'mock-1',
    name: 'Tetmosol Medicated Soap with 5% Monosulfiram for Skin Infections',
    packSize: 'Packet of 100 gm soap',
    price: 97,
    mrp: 105.7,
    discount: '8% off',
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=300',
    brand: 'Tetmosol',
    category: 'Skin Care',
  },
  {
    id: 'mock-2',
    name: 'Brilante Intense Brightening Serum | For Dark Spots | Paraben & Allergen-Free',
    packSize: 'Bottle of 50 ml serum',
    price: 669,
    mrp: 769,
    discount: '13% off',
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300',
    brand: 'Brilante',
    category: 'Skin Care',
  },
];

const CartScreen = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const {
    pharmacyCart,
    cart,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    pharmacySubtotal,
    pharmacyMrpTotal,
    pharmacySavings,
    pharmacyDiscountAmount,
    pharmacyDeliveryFee,
    pharmacyPackagingFee,
    pharmacyFinalTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    selectedAddress,
    updateAddress,
    addOrder,
    clearCart,
  } = useCart();

  const [checkoutModalVisible, setCheckoutModalVisible] = useState(
    Boolean(route?.params?.openCheckout)
  );

  useEffect(() => {
    if (route?.params?.openCheckout) {
      setCheckoutModalVisible(true);
    }
  }, [route?.params?.openCheckout]);

  const [recipientName, setRecipientName] = useState('Hemanth (Self)');
  const [contactPhone, setContactPhone] = useState('+91 97414 22544');
  const [deliveryMode, setDeliveryMode] = useState('Express');
  const [selectedSlot, setSelectedSlot] = useState('Today, Express (30–45 Mins)');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('UPI');
  const [walletBalance, setWalletBalance] = useState(2498);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderProcessStep, setOrderProcessStep] = useState(1);

  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay');
  const [upiId, setUpiId] = useState('');
  const [isUpiVerified, setIsUpiVerified] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [selectedBank, setSelectedBank] = useState('hdfc');
  const [deliveryAddress, setDeliveryAddress] = useState(
    selectedAddress?.addressLine || 'Flat 402, Green Valley Apartments, Kuvempunagar, Mysore'
  );
  const [gpsLoading, setGpsLoading] = useState(false);
  const [uploadedDocument, setUploadedDocument] = useState(null);

  const handleGpsAutofill = async () => {
    try {
      setGpsLoading(true);
      const perm = await requestLocationPermissionWebSafe();
      if (!perm.granted && perm.status !== 'granted') {
        showAlert('Permission Required', 'Location permission is required to detect delivery address.');
        setGpsLoading(false);
        return;
      }
      const pos = await getCurrentPositionWebSafe({ accuracy: 3 });
      if (pos?.coords) {
        const geo = await reverseGeocodeWebSafe(pos.coords.latitude, pos.coords.longitude);
        if (geo) {
          const formatted = `${geo.name ? geo.name + ', ' : ''}${geo.street ? geo.street + ', ' : ''}${geo.district || geo.city || ''}`;
          setDeliveryAddress(formatted || 'Current GPS Location, Kuvempunagar, Mysore');
        }
      }
      setGpsLoading(false);
    } catch (e) {
      setGpsLoading(false);
      setDeliveryAddress('Kuvempunagar 5th Main, Mysore');
    }
  };

  const handlePickDocument = async (typeChoice = 'any') => {
    try {
      if (Platform.OS === 'web' && typeof document !== 'undefined' && typeChoice !== 'camera') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = typeChoice === 'pdf' ? 'application/pdf' : 'image/*,application/pdf';
        input.onchange = (e) => {
          const file = e.target.files && e.target.files[0];
          if (file) {
            setUploadedDocument({
              name: file.name,
              size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
              type: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
              uri: URL.createObjectURL(file),
            });
          }
        };
        input.click();
        return;
      }

      if (typeChoice === 'camera') {
        if (Platform.OS !== 'web') {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            showAlert('Permission Required', 'Camera permission is required to capture documents.');
            return;
          }
        }
        const result = await ImagePicker.launchCameraAsync({
          quality: 0.8,
          allowsEditing: true,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          setUploadedDocument({
            name: `Camera_Rx_${Date.now().toString().slice(-4)}.jpg`,
            uri: asset.uri,
            type: 'image/jpeg',
            size: '1.2 MB',
          });
        }
      } else if (typeChoice === 'image') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          setUploadedDocument({
            name: asset.fileName || `Rx_Image_${Date.now().toString().slice(-4)}.jpg`,
            uri: asset.uri,
            type: 'image/jpeg',
            size: asset.fileSize ? `${(asset.fileSize / 1024 / 1024).toFixed(1)} MB` : '1.4 MB',
          });
        }
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: ['application/pdf', 'image/*'],
          copyToCacheDirectory: true,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          setUploadedDocument({
            name: asset.name || 'Prescription.pdf',
            uri: asset.uri,
            type: asset.mimeType || 'application/pdf',
            size: asset.size ? `${(asset.size / 1024 / 1024).toFixed(2)} MB` : '1.5 MB',
          });
        }
      }
    } catch (e) {
      console.log('Error picking document:', e);
    }
  };


  useEffect(() => {
    (async () => {
      try {
        const storedName = await AsyncStorage.getItem('userName');
        if (storedName && storedName.trim()) {
          setRecipientName(`${storedName.trim()} (Self)`);
        }
        const storedPhone = await AsyncStorage.getItem('userPhone');
        if (storedPhone && storedPhone.trim()) {
          setContactPhone(
            storedPhone.trim().startsWith('+91')
              ? storedPhone.trim()
              : `+91 ${storedPhone.trim()}`
          );
        }
        const bal = await AsyncStorage.getItem('@unnathi_wallet_balance');
        if (bal) setWalletBalance(parseInt(bal, 10) || 2498);
      } catch (e) {}
    })();
  }, []);

  const handleCardNumberChange = (text) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 16);
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (text) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 2) {
      setCardExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
    } else {
      setCardExpiry(cleaned);
    }
  };

  const handleConfirmPharmacyOrder = () => {
    if (!recipientName.trim()) {
      showAlert('Name Required', 'Please enter recipient name.');
      return;
    }
    if (!contactPhone.trim()) {
      showAlert('Phone Required', 'Please enter mobile number.');
      return;
    }
    if (!deliveryAddress.trim()) {
      showAlert('Address Required', 'Please enter complete delivery address.');
      return;
    }

    if (selectedPaymentMethod === 'WALLET') {
      if (walletBalance < netPayable) {
        showAlert(
          'Insufficient Wallet Balance 💳',
          `Your wallet balance is ₹${walletBalance.toLocaleString('en-IN')}, but the payable amount is ₹${netPayable.toLocaleString('en-IN')}.\n\nPlease top up or choose another payment method.`,
          [
            { text: 'Top Up Wallet', onPress: () => navigation.navigate('Wallet') },
            { text: 'Change Method', style: 'cancel' },
          ]
        );
        return;
      }
    }

    if (selectedPaymentMethod === 'CARD') {
      if (cardNumber.replace(/\s/g, '').length < 16) {
        showAlert('Invalid Card', 'Please enter a valid 16-digit card number.');
        return;
      }
      if (cardExpiry.length < 5) {
        showAlert('Invalid Expiry', 'Please enter card expiry in MM/YY format.');
        return;
      }
      if (cardCvv.length < 3) {
        showAlert('Invalid CVV', 'Please enter a valid 3-digit CVV.');
        return;
      }
    }

    if (selectedPaymentMethod === 'UPI' && !selectedUpiApp && !upiId.trim()) {
      showAlert('UPI Required', 'Please select a UPI app or enter your UPI ID.');
      return;
    }

    setIsSubmittingOrder(true);
    setOrderProcessStep(1);

    setTimeout(() => {
      setOrderProcessStep(2);
      setTimeout(async () => {
        setOrderProcessStep(3);

        const orderId = `UNC${Math.floor(10000 + Math.random() * 90000)}`;

        if (selectedPaymentMethod === 'WALLET') {
          const newBal = Math.max(0, walletBalance - netPayable);
          setWalletBalance(newBal);
          try {
            await AsyncStorage.setItem('@unnathi_wallet_balance', newBal.toString());
            const storedTx = await AsyncStorage.getItem('@unnathi_wallet_transactions');
            const existingTx = storedTx ? JSON.parse(storedTx) : [];
            const newTx = {
              id: `tx-${Date.now()}`,
              title: 'Paid via MediUnify Wallet',
              subtitle: `Pharmacy Order #${orderId}`,
              amount: `-₹${netPayable}`,
              type: 'debit',
              date: 'Just Now',
              icon: 'wallet-outline',
            };
            await AsyncStorage.setItem('@unnathi_wallet_transactions', JSON.stringify([newTx, ...existingTx]));
          } catch (e) {}
        }

        let paymentLabel = 'Cash on Delivery';
        if (selectedPaymentMethod === 'WALLET') paymentLabel = 'MediUnify Health Wallet';
        else if (selectedPaymentMethod === 'UPI') paymentLabel = `UPI (${selectedUpiApp.toUpperCase()})`;
        else if (selectedPaymentMethod === 'CARD') paymentLabel = `Card (Ending with ${cardNumber.slice(-4) || '4242'})`;
        else if (selectedPaymentMethod === 'NETBANKING') paymentLabel = `Net Banking (${selectedBank.toUpperCase()})`;

        const newOrder = {
          id: orderId,
          orderId: orderId,
          date: new Date().toLocaleString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          status: 'Confirmed',
          paymentMethod: paymentLabel,
          paymentStatus: selectedPaymentMethod === 'COD' ? 'Pay on Delivery' : 'Paid Online (Verified)',
          total: netPayable,
          subtotal: calculatedSubtotal,
          deliveryFee: 0,
          discountAmount: totalDiscount,
          items: items.map((i) => ({
            id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity || 1,
            brand: i.brand,
          })),
          address: {
            name: recipientName,
            phone: contactPhone,
            addressLine: deliveryAddress.trim(),
          },
          prescriptionAttached: uploadedDocument ? uploadedDocument.name : null,
          deliverySlot: `${selectedSlot} (${deliveryMode})`,
        };

        if (addOrder) await addOrder(newOrder);
        if (clearCart) clearCart();

        setTimeout(() => {
          setIsSubmittingOrder(false);
          setCheckoutModalVisible(false);
          navigation.replace('OrderSuccess', { order: newOrder });
        }, 1200);
      }, 1400);
    }, 1200);
  };

  const [localDemoItems, setLocalDemoItems] = useState(DEFAULT_MOCKUP_ITEMS);

  // Active items in pharmacy cart
  const items = (pharmacyCart && pharmacyCart.length > 0) ? pharmacyCart : localDemoItems;
  const itemsCount = items.reduce((acc, item) => acc + (item.quantity || 1), 0);

  const handleIncrease = (item) => {
    if (pharmacyCart && pharmacyCart.some((i) => i.id === item.id)) {
      increaseQuantity(item.id, 'pharmacy');
    } else {
      setLocalDemoItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, quantity: (it.quantity || 1) + 1 } : it))
      );
    }
  };

  const handleDecrease = (item) => {
    if (pharmacyCart && pharmacyCart.some((i) => i.id === item.id)) {
      decreaseQuantity(item.id, 'pharmacy');
    } else {
      setLocalDemoItems((prev) =>
        prev
          .map((it) => (it.id === item.id ? { ...it, quantity: (it.quantity || 1) - 1 } : it))
          .filter((it) => it.quantity > 0)
      );
    }
  };

  const handleAddDealToCart = (deal) => {
    if (addToCart) {
      addToCart({
        id: deal.id,
        name: deal.name,
        price: deal.price,
        mrp: deal.mrp,
        discount: deal.discount,
        image: deal.image,
        packSize: deal.packSize,
        category: deal.category,
        brand: deal.brand,
      }, 1, 'pharmacy');
    } else {
      setLocalDemoItems((prev) => [
        ...prev,
        {
          id: deal.id,
          name: deal.name,
          price: deal.price,
          mrp: deal.mrp,
          discount: deal.discount,
          quantity: 1,
          image: deal.image,
          packSize: deal.packSize,
          category: deal.category,
          brand: deal.brand,
        },
      ]);
    }
    showAlert('Added to Cart! 🛒', `${deal.name} has been added to your cart.`);
  };

  // Care Plan state
  const [hasCarePlan, setHasCarePlan] = useState(false);

  // Organ vital package checkup upsell state
  const [includeHealthPackage, setIncludeHealthPackage] = useState(false);
  const healthPackageFee = 649;

  // Coupon modal state
  const [couponModalVisible, setCouponModalVisible] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponMessage, setCouponMessage] = useState(null);

  // Address edit modal state
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [tempAddress, setTempAddress] = useState(selectedAddress?.addressLine || 'Gurgaon');

  const handleApplyPromo = (code) => {
    const promo = code || couponInput.trim().toUpperCase();
    if (!promo) {
      setCouponMessage({ success: false, text: 'Please enter a valid coupon code.' });
      return;
    }
    const res = applyCoupon ? applyCoupon(promo) : { success: true, coupon: { code: promo, discount: 50 } };
    if (res && res.success) {
      setCouponMessage({ success: true, text: `🎉 ${res.coupon?.code || promo} applied!` });
      setTimeout(() => setCouponModalVisible(false), 1200);
    } else {
      setCouponMessage({ success: false, text: 'Invalid promo code. Try MEDI20 or HEALTH50.' });
    }
  };

  const handleAddMembership = () => {
    setHasCarePlan(true);
    showAlert('Care Plan Added! 🛡️', 'You have unlocked extra ₹92 savings on this order.');
  };

  const handleToggleHealthPackage = () => {
    setIncludeHealthPackage(!includeHealthPackage);
  };

  // Exact calculations
  const calculatedSubtotal = pharmacySubtotal > 0
    ? pharmacySubtotal
    : items.reduce((sum, it) => sum + (it.price * (it.quantity || 1)), 0);

  const calculatedMrpTotal = pharmacyMrpTotal > 0
    ? pharmacyMrpTotal
    : items.reduce((sum, it) => sum + ((parseFloat(it.mrp) || (it.price * 1.15)) * (it.quantity || 1)), 0);

  const calculatedSavings = pharmacySavings > 0
    ? pharmacySavings
    : Math.max(0, calculatedMrpTotal - calculatedSubtotal);

  const carePlanSavings = hasCarePlan ? 92 : 0;
  const carePlanCost = hasCarePlan ? 165 : 0;
  const totalHandlingCharges = 12;
  const totalDiscount = calculatedSavings + (pharmacyDiscountAmount || 0) + carePlanSavings;
  const netPayable = Math.max(
    0,
    calculatedSubtotal +
      totalHandlingCharges +
      (includeHealthPackage ? healthPackageFee : 0) +
      carePlanCost -
      carePlanSavings -
      (pharmacyDiscountAmount || 0)
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* BREADCRUMB ROW (Desktop) */}
        {isDesktop ? (
          <View style={styles.breadcrumbWrap}>
            <View style={styles.breadcrumbInner}>
              <TouchableOpacity onPress={() => navigation.navigate('Home')} activeOpacity={0.7}>
                <Text style={styles.breadcrumbLink}>Home</Text>
              </TouchableOpacity>
              <Ionicons name="chevron-forward" size={13} color="#94A3B8" />
              <TouchableOpacity onPress={() => navigation.navigate('Pharmacy')} activeOpacity={0.7}>
                <Text style={styles.breadcrumbLink}>Pharmacy</Text>
              </TouchableOpacity>
              <Ionicons name="chevron-forward" size={13} color="#94A3B8" />
              <Text style={styles.breadcrumbActive}>Shopping Cart</Text>
            </View>
          </View>
        ) : (
          <View style={styles.mobileAppHeader}>
            <TouchableOpacity
              onPress={() => (navigation.canGoBack && navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Pharmacy'))}
              style={styles.mobileBackBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color="#0F172A" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.mobileHeaderTitle}>Shopping Cart</Text>
              <Text style={styles.mobileHeaderSub}>
                {items.length > 0 ? `${items.length} item${items.length > 1 ? 's' : ''} added` : '0 items'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Pharmacy')}
              style={styles.mobileAddMoreBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.mobileAddMoreText}>+ Add More</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* MAIN LAYOUT WRAPPER */}
        <View style={[styles.mainLayoutWrapper, !isDesktop && styles.mainLayoutWrapperMobile]}>
          {/* ============================================================
              LEFT COLUMN: CART ITEMS & DEALS SECTIONS
          ============================================================ */}
          <View style={[styles.leftColumn, !isDesktop && styles.columnMobile]}>
            {/* 1. CART ITEMS SECTION */}
            <View style={styles.cartItemsCard}>
              <View style={styles.cartHeaderRow}>
                <Text style={styles.cartHeaderTitle}>
                  {items.length > 0 ? `${items.length} item${items.length > 1 ? 's' : ''} added` : '0 items added'}
                </Text>
              </View>

              <Text style={styles.prescriptionNote}>Items not requiring prescription</Text>

              {items.length === 0 ? (
                <View style={styles.emptyCartBox}>
                  <Ionicons name="cart-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
                  <Text style={styles.emptyCartSub}>Add medicines, healthcare devices, and wellness products.</Text>
                  <TouchableOpacity
                    style={styles.browseProductsBtn}
                    onPress={() => navigation.navigate('Pharmacy')}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.browseProductsBtnText}>Browse Medicines</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.itemsListWrap}>
                  {items.map((item, index) => {
                    const price = item.price || 97;
                    const mrp = item.mrp || (price * 1.15).toFixed(1);
                    const qty = item.quantity || 1;
                    const discountText = item.discount || '8% off';

                    return (
                      <View key={item.id || index} style={styles.itemRowContainer}>
                        {/* Product Thumbnail */}
                        <View style={styles.itemImageWrap}>
                          <Image
                            source={{
                              uri: item.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300',
                            }}
                            style={styles.itemImage}
                            resizeMode="contain"
                          />
                        </View>

                        {/* Product Name & Subtitle */}
                        <View style={styles.itemDetailsCol}>
                          <Text style={styles.itemNameText} numberOfLines={2}>
                            {item.name}
                          </Text>
                          <Text style={styles.itemSubtitleText}>
                            {item.packSize || item.category || 'Packet of 100 gm soap'}
                          </Text>
                        </View>

                        {/* Price & Quantity Selector */}
                        <View style={styles.itemActionsCol}>
                          <View style={styles.itemPriceRow}>
                            <Text style={styles.itemPriceVal}>₹{price}</Text>
                            <Text style={styles.itemMrpVal}>₹{mrp}</Text>
                            <Text style={styles.itemDiscountVal}>{discountText}</Text>
                          </View>

                          {/* Red Quantity Selector Box */}
                          <View style={styles.qtySelectorBox}>
                            <TouchableOpacity
                              style={styles.qtyBtn}
                              onPress={() => handleDecrease(item)}
                              activeOpacity={0.7}
                            >
                              {(item.quantity || 1) > 1 ? (
                                <Text style={styles.qtyMinusText}>−</Text>
                              ) : (
                                <Ionicons name="trash-outline" size={14} color="#EF4444" />
                              )}
                            </TouchableOpacity>

                            <Text style={styles.qtyValueText}>{item.quantity || 1}</Text>

                            <TouchableOpacity
                              style={styles.qtyBtn}
                              onPress={() => handleIncrease(item)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.qtyPlusText}>+</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* 2. TOP DEALS SECTION (Matching "Sanofi top deals") */}
            <View style={styles.dealsSectionCard}>
              <View style={styles.dealsHeaderRow}>
                <Text style={styles.dealsSectionTitle}>Sanofi top deals</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dealsScrollContainer}
              >
                {TOP_DEALS.map((deal) => (
                  <View key={deal.id} style={styles.dealCard}>
                    <View style={styles.dealImageWrap}>
                      <Image source={{ uri: deal.image }} style={styles.dealImage} resizeMode="contain" />
                    </View>

                    <Text style={styles.dealNameText} numberOfLines={2}>
                      {deal.name}
                    </Text>
                    <Text style={styles.dealPackSize} numberOfLines={1}>
                      {deal.packSize}
                    </Text>

                    {/* Rating */}
                    <View style={styles.dealRatingRow}>
                      <View style={styles.starRatingBadge}>
                        <Ionicons name="star" size={10} color="#FFFFFF" />
                        <Text style={styles.starRatingText}>{deal.rating}</Text>
                      </View>
                      <Text style={styles.reviewsCountText}>({deal.reviews})</Text>
                    </View>

                    <Text style={styles.dealEtaText}>{deal.eta}</Text>

                    {/* Price & Discount */}
                    <View style={styles.dealPriceRow}>
                      <Text style={styles.dealPriceText}>₹{deal.price}</Text>
                      <Text style={styles.dealMrpText}>₹{deal.mrp}</Text>
                      <Text style={styles.dealDiscountText}>{deal.discount}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.addToCartBtn}
                      onPress={() => handleAddDealToCart(deal)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.addToCartBtnText}>Add to cart</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* 3. LAST MINUTE BUYS SECTION */}
            <View style={styles.dealsSectionCard}>
              <View style={styles.dealsHeaderRow}>
                <Text style={styles.dealsSectionTitle}>Last minute buys</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dealsScrollContainer}
              >
                {LAST_MINUTE_BUYS.map((buy) => (
                  <View key={buy.id} style={styles.dealCard}>
                    <View style={styles.dealImageWrap}>
                      <Image source={{ uri: buy.image }} style={styles.dealImage} resizeMode="contain" />
                    </View>

                    <Text style={styles.dealNameText} numberOfLines={2}>
                      {buy.name}
                    </Text>
                    <Text style={styles.dealPackSize} numberOfLines={1}>
                      {buy.packSize}
                    </Text>

                    <View style={styles.dealRatingRow}>
                      <View style={styles.starRatingBadge}>
                        <Ionicons name="star" size={10} color="#FFFFFF" />
                        <Text style={styles.starRatingText}>{buy.rating}</Text>
                      </View>
                    </View>

                    <Text style={styles.dealEtaText}>{buy.eta}</Text>

                    <View style={styles.dealPriceRow}>
                      <Text style={styles.dealPriceText}>₹{buy.price}</Text>
                      <Text style={styles.dealMrpText}>₹{buy.mrp}</Text>
                      <Text style={styles.dealDiscountText}>{buy.discount}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.addToCartBtn}
                      onPress={() => handleAddDealToCart(buy)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.addToCartBtnText}>Add to cart</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* ============================================================
              RIGHT COLUMN: CARE PLAN, COUPON, VITAL UPSELL, BILL SUMMARY
          ============================================================ */}
          <View style={[styles.rightColumn, !isDesktop && styles.rightColumnMobile]}>
            {/* 1. CARE PLAN / VIP MEMBERSHIP CARD */}
            <View style={styles.carePlanCard}>
              <View style={styles.carePlanBadge}>
                <Text style={styles.carePlanBadgeText}>Care Plan</Text>
              </View>

              <Text style={styles.carePlanHeading}>You can save extra ₹92 on this order</Text>
              <Text style={styles.carePlanSub}>Become a careplan member</Text>
              <Text style={styles.carePlanPriceText}>
                3 months membership for only <Text style={{ fontWeight: '800', color: '#0F172A' }}>₹165</Text>{' '}
                <Text style={styles.carePlanMrp}>₹549</Text> <Text style={styles.carePlanDiscount}>70% off</Text>
              </Text>

              <View style={styles.carePlanActionsRow}>
                <TouchableOpacity
                  style={styles.knowMoreBtn}
                  onPress={() => showAlert('Care Plan Benefits', 'Enjoy extra discounts on all orders, zero delivery fees, and priority health support.')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.knowMoreText}>Know more</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.addMembershipBtn, hasCarePlan && { backgroundColor: '#10B981' }]}
                  onPress={handleAddMembership}
                  activeOpacity={0.88}
                >
                  <Text style={styles.addMembershipBtnText}>
                    {hasCarePlan ? '✓ Added' : 'Add membership'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. APPLY COUPON CARD */}
            <TouchableOpacity
              style={styles.couponCard}
              onPress={() => setCouponModalVisible(true)}
              activeOpacity={0.85}
            >
              <View style={styles.couponCardLeft}>
                <View style={styles.couponIconBox}>
                  <Ionicons name="pricetag" size={16} color="#475569" />
                </View>
                <Text style={styles.couponCardText}>
                  {appliedCoupon ? `Applied: ${appliedCoupon.code} (-₹${appliedCoupon.discount})` : 'Apply coupon'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#64748B" />
            </TouchableOpacity>

            {/* 3. HEALTH CHECKUP UPSELL ("Check the health of your vital organs") */}
            <View style={styles.vitalOrgansCard}>
              <View style={styles.vitalHeaderRow}>
                <Text style={styles.vitalHeaderTitle}>Check the health of your vital organs</Text>
                <Ionicons name="information-circle-outline" size={16} color="#64748B" />
              </View>

              <TouchableOpacity
                style={styles.vitalCheckboxRow}
                onPress={handleToggleHealthPackage}
                activeOpacity={0.85}
              >
                <View style={[styles.customCheckbox, includeHealthPackage && styles.customCheckboxChecked]}>
                  {includeHealthPackage && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </View>
                <Text style={styles.vitalPackageTitle}>
                  Book Good Health Silver Package for just ₹649
                </Text>
              </TouchableOpacity>

              <Text style={styles.vitalPackageDesc}>
                Get the tests done easily from your home. This package will help you in identifying potential disorders and deficiencies at an early stage.
              </Text>
              <Text style={styles.vitalPackageSubText}>Pay later on home sample collection</Text>
            </View>

            {/* 4. BILL SUMMARY CARD */}
            <View style={styles.billSummaryCard}>
              <Text style={styles.billSummaryTitle}>Bill summary</Text>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Item total (MRP)</Text>
                <Text style={styles.billValue}>₹{calculatedMrpTotal.toFixed(1)}</Text>
              </View>

              <View style={styles.billRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.billLabel}>Handling charges</Text>
                  <Ionicons name="help-circle-outline" size={13} color="#94A3B8" />
                </View>
                <Text style={styles.billValue}>₹{totalHandlingCharges}</Text>
              </View>

              {totalDiscount > 0 && (
                <View style={styles.billRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={styles.billLabel}>Total discount</Text>
                    <Ionicons name="help-circle-outline" size={13} color="#94A3B8" />
                  </View>
                  <Text style={[styles.billValue, { color: '#16A34A', fontWeight: '700' }]}>
                    -₹{totalDiscount.toFixed(1)}
                  </Text>
                </View>
              )}

              {includeHealthPackage && (
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Good Health Package</Text>
                  <Text style={styles.billValue}>₹{healthPackageFee}</Text>
                </View>
              )}

              {hasCarePlan && (
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Care Plan Membership (3 Mo)</Text>
                  <Text style={styles.billValue}>₹165</Text>
                </View>
              )}

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Shipping fee</Text>
                <Text style={styles.billValue}>FREE</Text>
              </View>

              <View style={styles.billDivider} />

              <View style={styles.billTotalRow}>
                <Text style={styles.toPayLabel}>To be paid</Text>
                <Text style={styles.toPayVal}>₹{netPayable.toFixed(0)}</Text>
              </View>
            </View>



            {/* 6. PRIMARY CONTINUE / CHECKOUT BUTTON */}
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => setCheckoutModalVisible(true)}
              activeOpacity={0.88}
            >
              <Text style={styles.continueBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* WEB FOOTER */}
        {Platform.OS === 'web' && isDesktop && (
          <View style={{ width: '100%', marginTop: 50 }}>
            <WebFooter navigation={navigation} />
          </View>
        )}
      </ScrollView>

      {/* ============================================================
          APPLY COUPON MODAL
      ============================================================ */}
      <Modal
        visible={couponModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCouponModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setCouponModalVisible(false)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Apply Promo Code</Text>
              <TouchableOpacity onPress={() => setCouponModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalInputRow}>
              <TextInput
                style={styles.modalTextInput}
                placeholder="Enter promo code (e.g. MEDI20)"
                placeholderTextColor="#94A3B8"
                value={couponInput}
                onChangeText={setCouponInput}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={styles.modalApplyBtn}
                onPress={() => handleApplyPromo()}
                activeOpacity={0.85}
              >
                <Text style={styles.modalApplyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>

            {/* Quick chips */}
            <View style={styles.promoChipsRow}>
              {['MEDI20', 'HEALTH50', 'FLAT100'].map((chip) => (
                <TouchableOpacity
                  key={chip}
                  style={styles.promoChip}
                  onPress={() => handleApplyPromo(chip)}
                >
                  <Text style={styles.promoChipText}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {couponMessage && (
              <Text
                style={[
                  styles.couponMessageText,
                  { color: couponMessage.success ? '#16A34A' : '#DC2626' },
                ]}
              >
                {couponMessage.text}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ============================================================
          CHANGE ADDRESS MODAL
      ============================================================ */}
      <Modal
        visible={addressModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setAddressModalVisible(false)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Delivery Address</Text>
              <TouchableOpacity onPress={() => setAddressModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.modalTextInput, { height: 70, textAlignVertical: 'top', marginTop: 10 }]}
              placeholder="Enter complete house address & locality"
              placeholderTextColor="#94A3B8"
              value={tempAddress}
              onChangeText={setTempAddress}
              multiline
            />

            <TouchableOpacity
              style={[styles.modalApplyBtn, { width: '100%', marginTop: 14, height: 44 }]}
              onPress={() => {
                if (updateAddress) {
                  updateAddress({ addressLine: tempAddress });
                }
                setAddressModalVisible(false);
              }}
              activeOpacity={0.88}
            >
              <Text style={styles.modalApplyBtnText}>Save Address</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ============================================================
          CHECKOUT & PAYMENT MODAL OVERLAY (CART SCREEN AS BACKSIDE)
      ============================================================ */}
      <Modal
        visible={checkoutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCheckoutModalVisible(false)}
      >
        <View style={styles.checkoutModalBackdrop}>
          <View style={styles.checkoutModalCard}>
            {/* MODAL HEADER */}
            <View style={styles.checkoutModalHeader}>
              <View>
                <View style={styles.checkoutConfidentialPill}>
                  <Ionicons name="lock-closed" size={11} color="#FF5252" />
                  <Text style={styles.checkoutConfidentialPillText}>100% SECURE & VERIFIED PHARMACY</Text>
                </View>
                <Text style={styles.checkoutModalTitle}>Confirm Pharmacy Order</Text>
                <Text style={styles.checkoutModalSub} numberOfLines={1}>
                  Express Doorstep Delivery (30–45 Mins) • 100% Genuine
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setCheckoutModalVisible(false)}
                style={styles.checkoutModalCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* FORM BODY */}
            <ScrollView style={styles.checkoutModalForm} showsVerticalScrollIndicator={false}>
              {/* RECIPIENT NAME */}
              <Text style={styles.checkoutInputLabel}>Recipient / Patient Name</Text>
              <TextInput
                style={styles.checkoutTextInput}
                value={recipientName}
                onChangeText={setRecipientName}
                placeholder="Enter recipient full name"
                placeholderTextColor="#94A3B8"
              />

              {/* MOBILE NUMBER */}
              <Text style={styles.checkoutInputLabel}>Contact Mobile Number</Text>
              <TextInput
                style={styles.checkoutTextInput}
                value={contactPhone}
                onChangeText={setContactPhone}
                keyboardType="phone-pad"
                placeholder="+91 98450 12345"
                placeholderTextColor="#94A3B8"
              />


              {/* DELIVERY ADDRESS */}
              <View style={styles.checkoutLabelWithActionRow}>
                <Text style={styles.checkoutInputLabelNoMargin}>Delivery Address & Landmark</Text>
                <TouchableOpacity
                  style={styles.checkoutGpsChip}
                  onPress={handleGpsAutofill}
                  disabled={gpsLoading}
                  activeOpacity={0.8}
                >
                  {gpsLoading ? (
                    <ActivityIndicator size="small" color="#FF5252" />
                  ) : (
                    <Ionicons name="navigate" size={12} color="#FF5252" />
                  )}
                  <Text style={styles.checkoutGpsText}>
                    {gpsLoading ? 'Locating...' : 'Auto-locate GPS'}
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.checkoutTextInput, { height: 60, textAlignVertical: 'top' }]}
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                placeholder="Flat / House No., Apartment name, Street, Area & Landmark"
                placeholderTextColor="#94A3B8"
                multiline
              />

              {/* ORDERED MEDICINES & TABLETS SUMMARY */}
              <View style={styles.checkoutTabletsHeaderRow}>
                <Text style={styles.checkoutInputLabelNoMargin}>Ordered Medicines & Tablets ({items.length})</Text>
                <Text style={styles.checkoutTabletsSub}>Verified Stock</Text>
              </View>
              <View style={styles.checkoutTabletsContainer}>
                {items.map((item, idx) => (
                  <View key={item.id || idx} style={styles.checkoutTabletRow}>
                    <View style={styles.checkoutTabletIconWrap}>
                      <Ionicons name="medkit-outline" size={16} color="#FF5252" />
                    </View>
                    <View style={{ flex: 1, marginHorizontal: 8 }}>
                      <Text style={styles.checkoutTabletName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.checkoutTabletPack}>
                        {item.packSize || item.category || 'Tablets / Health Product'} • Qty: {item.quantity || 1}
                      </Text>
                    </View>
                    <Text style={styles.checkoutTabletPrice}>
                      ₹{(item.price * (item.quantity || 1)).toLocaleString('en-IN')}
                    </Text>
                  </View>
                ))}
              </View>

              {/* UPLOAD PRESCRIPTION OPTION */}
              <Text style={styles.checkoutInputLabel}>Doctor Prescription / Rx (Optional)</Text>
              {!uploadedDocument ? (
                <View style={styles.checkoutUploadBox}>
                  <View style={styles.checkoutUploadBtnRow}>
                    <TouchableOpacity
                      style={styles.checkoutUploadBtn}
                      onPress={() => handlePickDocument('pdf')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="document-text" size={15} color="#DC2626" />
                      <Text style={styles.checkoutUploadBtnText}>Upload PDF</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.checkoutUploadBtn}
                      onPress={() => handlePickDocument('image')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="image" size={15} color="#FF5252" />
                      <Text style={styles.checkoutUploadBtnText}>Upload Image</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.checkoutUploadBtn}
                      onPress={() => handlePickDocument('camera')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="camera" size={15} color="#2563EB" />
                      <Text style={styles.checkoutUploadBtnText}>Camera</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.checkoutUploadHint}>
                    Attach doctor prescription or medicine pack photo for pharmacist review.
                  </Text>
                </View>
              ) : (
                <View style={styles.checkoutUploadedFileCard}>
                  <View style={styles.checkoutUploadedIconWrap}>
                    <Ionicons
                      name={uploadedDocument.type?.includes('pdf') ? 'document-text' : 'image'}
                      size={20}
                      color="#FF5252"
                    />
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 8 }}>
                    <Text style={styles.checkoutUploadedFileName} numberOfLines={1}>
                      {uploadedDocument.name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <Text style={styles.checkoutUploadedFileSize}>{uploadedDocument.size}</Text>
                      <Text style={{ fontSize: 10, color: '#94A3B8' }}>•</Text>
                      <Text style={styles.checkoutUploadedFileBadge}>✓ Attached to Order</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => setUploadedDocument(null)}
                    style={styles.checkoutRemoveFileBtn}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              )}


              {/* PREFERRED DELIVERY TIME */}
              <Text style={styles.checkoutInputLabel}>Preferred Delivery Time</Text>
              <View style={styles.checkoutSlotPickerRow}>
                {['Today, Express (30–45 Mins)', 'Tomorrow, 11:00 AM', 'Tomorrow, 04:00 PM'].map((slot, i) => {
                  const isSelected = selectedSlot === slot;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[styles.checkoutSlotChip, isSelected && styles.checkoutSlotChipSelected]}
                      onPress={() => setSelectedSlot(slot)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.checkoutSlotChipText, isSelected && styles.checkoutSlotChipTextSelected]}>
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* SELECT PAYMENT METHOD */}
              <Text style={styles.checkoutInputLabel}>Select Payment Method</Text>
              <View style={styles.checkoutPaymentMethodsWrap}>
                {PAYMENT_METHODS_CHECKOUT.map((pm) => {
                  const isSelected = selectedPaymentMethod === pm.id;
                  return (
                    <TouchableOpacity
                      key={pm.id}
                      style={[
                        styles.checkoutPaymentMethodRow,
                        isSelected && styles.checkoutPaymentMethodRowSelected,
                      ]}
                      onPress={() => setSelectedPaymentMethod(pm.id)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.checkoutPaymentRadio,
                          isSelected && styles.checkoutPaymentRadioSelected,
                        ]}
                      >
                        {isSelected && <View style={styles.checkoutPaymentRadioDot} />}
                      </View>
                      <Ionicons
                        name={pm.icon}
                        size={18}
                        color={isSelected ? '#FF5252' : pm.iconColor || '#64748B'}
                      />
                      <Text
                        style={[
                          styles.checkoutPaymentMethodLabel,
                          isSelected && styles.checkoutPaymentMethodLabelSelected,
                        ]}
                      >
                        {pm.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* METHOD-SPECIFIC INTERACTIVE DETAILS */}
              {selectedPaymentMethod === 'UPI' && (
                <View style={styles.checkoutMethodDetailBox}>
                  <Text style={styles.checkoutSubInputLabel}>Choose Instant UPI App</Text>
                  <View style={styles.checkoutUpiAppsRow}>
                    {UPI_APPS.map((app) => (
                      <TouchableOpacity
                        key={app.id}
                        style={[
                          styles.checkoutUpiAppBtn,
                          selectedUpiApp === app.id && styles.checkoutUpiAppBtnActive,
                        ]}
                        onPress={() => setSelectedUpiApp(app.id)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={app.icon}
                          size={15}
                          color={selectedUpiApp === app.id ? '#FF5252' : app.color}
                        />
                        <Text
                          style={[
                            styles.checkoutUpiAppBtnText,
                            selectedUpiApp === app.id && styles.checkoutUpiAppBtnTextActive,
                          ]}
                        >
                          {app.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.checkoutSubInputLabel, { marginTop: 8 }]}>Or Enter UPI ID / VPA</Text>
                  <View style={styles.checkoutUpiInputRow}>
                    <TextInput
                      style={[styles.checkoutTextInput, { flex: 1 }]}
                      placeholder="username@okhdfcbank"
                      placeholderTextColor="#94A3B8"
                      value={upiId}
                      onChangeText={setUpiId}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={[styles.checkoutUpiVerifyBtn, isUpiVerified && styles.checkoutUpiVerifyBtnDone]}
                      onPress={() => {
                        if (upiId.trim()) setIsUpiVerified(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.checkoutUpiVerifyBtnText}>
                        {isUpiVerified ? 'Verified ✓' : 'Verify'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {selectedPaymentMethod === 'CARD' && (
                <View style={styles.checkoutMethodDetailBox}>
                  <Text style={styles.checkoutSubInputLabel}>Card Number</Text>
                  <TextInput
                    style={styles.checkoutTextInput}
                    placeholder="1234 5678 9012 3456"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    value={cardNumber}
                    onChangeText={handleCardNumberChange}
                    maxLength={19}
                  />

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.checkoutSubInputLabel}>Expiry (MM/YY)</Text>
                      <TextInput
                        style={styles.checkoutTextInput}
                        placeholder="MM/YY"
                        placeholderTextColor="#94A3B8"
                        keyboardType="number-pad"
                        value={cardExpiry}
                        onChangeText={handleExpiryChange}
                        maxLength={5}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.checkoutSubInputLabel}>CVV</Text>
                      <TextInput
                        style={styles.checkoutTextInput}
                        placeholder="•••"
                        placeholderTextColor="#94A3B8"
                        keyboardType="number-pad"
                        secureTextEntry
                        value={cardCvv}
                        onChangeText={(t) => setCardCvv(t.slice(0, 3))}
                        maxLength={3}
                      />
                    </View>
                  </View>
                </View>
              )}

              {selectedPaymentMethod === 'NETBANKING' && (
                <View style={styles.checkoutMethodDetailBox}>
                  <Text style={styles.checkoutSubInputLabel}>Select Bank</Text>
                  <View style={styles.checkoutBankPickerGrid}>
                    {POPULAR_BANKS.map((b) => (
                      <TouchableOpacity
                        key={b.id}
                        style={[
                          styles.checkoutBankChip,
                          selectedBank === b.id && styles.checkoutBankChipActive,
                        ]}
                        onPress={() => setSelectedBank(b.id)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.checkoutBankChipText,
                            selectedBank === b.id && styles.checkoutBankChipTextActive,
                          ]}
                        >
                          {b.name}
                        </Text>
                        {selectedBank === b.id && (
                          <Ionicons name="checkmark-circle" size={14} color="#FF5252" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {selectedPaymentMethod === 'WALLET' && (
                <View style={styles.checkoutMethodDetailBox}>
                  <View style={styles.checkoutWalletBalanceRow}>
                    <View>
                      <Text style={styles.checkoutWalletBalLabel}>Available Wallet Balance</Text>
                      <Text
                        style={[
                          styles.checkoutWalletBalValue,
                          walletBalance < netPayable && { color: '#EF4444' },
                        ]}
                      >
                        ₹{walletBalance.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.checkoutWalletTopUpBtn}
                      onPress={() => navigation.navigate('Wallet')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="add-circle" size={14} color="#FFFFFF" />
                      <Text style={styles.checkoutWalletTopUpBtnText}>Top Up</Text>
                    </TouchableOpacity>
                  </View>

                  {walletBalance >= netPayable ? (
                    <View style={styles.checkoutWalletNoticeSuccess}>
                      <Ionicons name="checkmark-circle" size={14} color="#059669" />
                      <Text style={styles.checkoutWalletNoticeTextSuccess}>
                        Sufficient balance. ₹{(walletBalance - netPayable).toLocaleString('en-IN')} will remain after payment.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.checkoutWalletNoticeWarning}>
                      <Ionicons name="warning" size={14} color="#EF4444" />
                      <Text style={styles.checkoutWalletNoticeTextWarning}>
                        Insufficient balance. Please top up ₹{(netPayable - walletBalance).toLocaleString('en-IN')}.
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {selectedPaymentMethod === 'COD' && (
                <View style={styles.checkoutMethodDetailBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="cash-outline" size={20} color="#D97706" />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>
                      Cash on Delivery (Pay at Doorstep)
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                    Pay ₹{netPayable.toLocaleString('en-IN')} in cash or UPI QR scan when your order arrives.
                  </Text>
                </View>
              )}

              {/* PRICING SUMMARY BOX */}
              <View style={styles.checkoutPricingSummaryBox}>
                <View style={styles.checkoutSummaryRow}>
                  <Text style={styles.checkoutSummaryLabel}>Total Amount Payable</Text>
                  <Text style={styles.checkoutSummaryValue}>₹{netPayable.toLocaleString('en-IN')}</Text>
                </View>
                <Text style={styles.checkoutSummaryNote}>
                  ✓ Zero cancellation fee • 100% genuine medicines • Instant confirmation
                </Text>
              </View>

              {/* PRIVACY ASSURANCE BOX */}
              <View style={styles.checkoutPrivacyAssuranceBox}>
                <Ionicons name="shield-checkmark" size={16} color="#059669" />
                <Text style={styles.checkoutPrivacyAssuranceText}>
                  Your privacy is sacred to us. Sealed cold-chain packaging, discrete bill descriptions, and tamper-proof delivery.
                </Text>
              </View>
            </ScrollView>

            {/* STICKY BOTTOM CONFIRM BUTTON */}
            <View style={styles.checkoutModalFooter}>
              <TouchableOpacity
                style={[
                  styles.checkoutConfirmBtn,
                  isSubmittingOrder && styles.checkoutConfirmBtnDisabled,
                ]}
                onPress={handleConfirmPharmacyOrder}
                activeOpacity={0.88}
                disabled={isSubmittingOrder}
              >
                {isSubmittingOrder ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.checkoutConfirmBtnText}>
                    Confirm Order & Pay ₹{netPayable.toLocaleString('en-IN')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* PROCESSING MODAL */}
      <Modal visible={isSubmittingOrder} transparent animationType="fade">
        <View style={styles.procModalOverlay}>
          <View style={styles.processModal}>
            {orderProcessStep < 3 ? (
              <>
                <ActivityIndicator size="large" color="#FF5252" />
                <Text style={styles.processTitle}>
                  {orderProcessStep === 1 ? 'Connecting to Payment Gateway...' : 'Authorizing Payment...'}
                </Text>
                <Text style={styles.processSub}>
                  {orderProcessStep === 1
                    ? 'Establishing secure 256-bit SSL encrypted tunnel'
                    : 'Verifying payment credentials with the issuing bank'}
                </Text>
                <View style={styles.processStepRow}>
                  {[1, 2, 3].map((s) => (
                    <View
                      key={s}
                      style={[styles.processDot, orderProcessStep >= s && styles.processDotActive]}
                    />
                  ))}
                </View>
              </>
            ) : (
              <>
                <View style={styles.successIconCircle}>
                  <Ionicons name="checkmark" size={36} color="#FFFFFF" />
                </View>
                <Text style={[styles.processTitle, { color: '#059669' }]}>Payment Successful! 🎉</Text>
                <Text style={styles.processSub}>Generating your official medicine order receipt...</Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
  },

  // BREADCRUMB
  breadcrumbWrap: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  breadcrumbInner: {
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breadcrumbLink: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  breadcrumbActive: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },

  // MOBILE HEADER
  mobileAppHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  mobileBackBtn: {
    padding: 6,
    marginLeft: -6,
  },
  mobileHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  mobileHeaderSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  mobileAddMoreBtn: {
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  mobileAddMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF5252',
  },

  // MAIN LAYOUT WRAPPER (2-Column Desktop Grid / 1-Col Mobile)
  mainLayoutWrapper: {
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 32,
  },
  mainLayoutWrapperMobile: {
    paddingHorizontal: 14,
    paddingTop: 12,
    flexDirection: 'column',
    gap: 16,
  },
  columnMobile: {
    width: '100%',
    flex: undefined,
  },
  rightColumnMobile: {
    width: '100%',
    position: 'relative',
    top: 0,
    marginTop: 8,
  },

  // LEFT COLUMN
  leftColumn: {
    flex: 1.4,
    gap: 28,
  },

  // CART ITEMS CARD
  cartItemsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  cartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cartHeaderTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
  },
  prescriptionNote: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
  },

  // Empty Cart
  emptyCartBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyCartTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyCartSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 340,
    marginBottom: 12,
  },
  browseProductsBtn: {
    backgroundColor: '#FF5252',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  browseProductsBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Items List Rows
  itemsListWrap: {
    gap: 16,
  },
  itemRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 16,
  },
  itemImageWrap: {
    width: 68,
    height: 68,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 4,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemDetailsCol: {
    flex: 1,
    gap: 4,
  },
  itemNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 19,
  },
  itemSubtitleText: {
    fontSize: 12,
    color: '#64748B',
  },
  itemActionsCol: {
    alignItems: 'flex-end',
    gap: 10,
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  itemPriceVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  itemMrpVal: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  itemDiscountVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16A34A',
  },

  // Red Quantity Selector Box (Matching Reference Image)
  qtySelectorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FED7AA',
    backgroundColor: '#FFF7ED',
    borderRadius: 6,
    height: 32,
  },
  qtyBtn: {
    paddingHorizontal: 10,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyMinusText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '800',
  },
  qtyPlusText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '800',
  },
  qtyValueText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    paddingHorizontal: 6,
  },

  // DEALS SECTIONS (Sanofi Top Deals & Last Minute Buys)
  dealsSectionCard: {
    backgroundColor: '#FFFFFF',
    paddingTop: 10,
  },
  dealsHeaderRow: {
    marginBottom: 14,
  },
  dealsSectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1E293B',
  },
  dealsScrollContainer: {
    gap: 14,
    paddingRight: 20,
    paddingBottom: 6,
  },
  dealCard: {
    width: 170,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'space-between',
  },
  dealImageWrap: {
    width: '100%',
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  dealImage: {
    width: '100%',
    height: '100%',
  },
  dealNameText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 16,
    height: 32,
    marginBottom: 2,
  },
  dealPackSize: {
    fontSize: 10.5,
    color: '#64748B',
    marginBottom: 6,
  },
  dealRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  starRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#16A34A',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  starRatingText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  reviewsCountText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  dealEtaText: {
    fontSize: 10.5,
    color: '#64748B',
    marginBottom: 6,
  },
  dealPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  dealPriceText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  dealMrpText: {
    fontSize: 10.5,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  dealDiscountText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#16A34A',
  },
  addToCartBtn: {
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  addToCartBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#EF4444',
  },

  // ============================================================
  // RIGHT COLUMN (STICKY SIDEBAR)
  // ============================================================
  rightColumn: {
    width: 380,
    gap: 16,
    position: Platform.OS === 'web' ? 'sticky' : 'relative',
    top: Platform.OS === 'web' ? 20 : 0,
  },

  // 1. CARE PLAN CARD
  carePlanCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 8,
    padding: 16,
    gap: 6,
  },
  carePlanBadge: {
    backgroundColor: '#7F1D1D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  carePlanBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  carePlanHeading: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  carePlanSub: {
    fontSize: 12,
    color: '#64748B',
  },
  carePlanPriceText: {
    fontSize: 11.5,
    color: '#475569',
    marginTop: 2,
  },
  carePlanMrp: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  carePlanDiscount: {
    color: '#16A34A',
    fontWeight: '700',
  },
  carePlanActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  knowMoreBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  knowMoreText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  addMembershipBtn: {
    flex: 1.2,
    backgroundColor: '#FF5252',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMembershipBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // 2. APPLY COUPON CARD
  couponCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  couponCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  couponIconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponCardText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },

  // 3. VITAL ORGANS UPSELL CARD
  vitalOrgansCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  vitalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vitalHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  vitalCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 4,
  },
  customCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  customCheckboxChecked: {
    backgroundColor: '#FF5252',
    borderColor: '#FF5252',
  },
  vitalPackageTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    lineHeight: 18,
  },
  vitalPackageDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  vitalPackageSubText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
  },

  // 4. BILL SUMMARY CARD
  billSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 18,
    gap: 10,
  },
  billSummaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  billLabel: {
    fontSize: 12.5,
    color: '#64748B',
  },
  billValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  billTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  toPayLabel: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  toPayVal: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },

  // 5. DELIVERING TO CARD
  deliveringToCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  deliveringLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  deliveringLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  deliveringAddress: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    maxWidth: 220,
  },
  addAddressLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FF5252',
  },

  // 6. PRIMARY CONTINUE BUTTON
  continueBtn: {
    backgroundColor: '#FF5252',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // MODALS
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.2)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.2,
          shadowRadius: 20,
          elevation: 8,
        }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalInputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  modalTextInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: '#0F172A',
  },
  modalApplyBtn: {
    backgroundColor: '#FF5252',
    paddingHorizontal: 18,
    height: 42,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalApplyBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  promoChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  promoChip: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  promoChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  couponMessageText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },

  // ==========================================
  // CHECKOUT MODAL OVERLAY STYLES (MATCHED TO #FF5252)
  // ==========================================
  checkoutModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  checkoutModalCard: {
    width: '100%',
    maxWidth: 490,
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 12px 28px rgba(0, 0, 0, 0.25)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.25,
          shadowRadius: 28,
          elevation: 10,
        }),
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  checkoutModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#FEE2E2',
    backgroundColor: '#FFFFFF',
  },
  checkoutConfidentialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  checkoutConfidentialPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FF5252',
    letterSpacing: 0.3,
  },
  checkoutModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  checkoutModalSub: {
    fontSize: 12,
    color: '#FF5252',
    fontWeight: '600',
    maxWidth: 320,
    marginTop: 2,
  },
  checkoutModalCloseBtn: {
    padding: 4,
  },
  checkoutModalForm: {
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  checkoutInputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  checkoutSubInputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  checkoutTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
  },

  // ADDRESS & GPS
  checkoutLabelWithActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 6,
  },
  checkoutInputLabelNoMargin: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  checkoutGpsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  checkoutGpsText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FF5252',
  },

  // TABLETS & MEDICINES SUMMARY
  checkoutTabletsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 6,
  },
  checkoutTabletsSub: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  checkoutTabletsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 8,
    gap: 8,
    marginBottom: 4,
  },
  checkoutTabletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  checkoutTabletIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutTabletName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  checkoutTabletPack: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  checkoutTabletPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },

  // PRESCRIPTION UPLOAD
  checkoutUploadBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    padding: 10,
    marginBottom: 4,
  },
  checkoutUploadBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  checkoutUploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 8,
  },
  checkoutUploadBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  checkoutUploadHint: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },
  checkoutUploadedFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
    marginBottom: 4,
  },
  checkoutUploadedIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  checkoutUploadedFileName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  checkoutUploadedFileSize: {
    fontSize: 10,
    color: '#64748B',
  },
  checkoutUploadedFileBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  checkoutRemoveFileBtn: {
    padding: 6,
  },

  // MODE TOGGLE
  checkoutModeToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  checkoutModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  checkoutModeBtnSelected: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FF5252',
  },
  checkoutModeBtnText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  checkoutModeBtnTextSelected: {
    color: '#FF5252',
    fontWeight: '800',
  },

  // SLOTS
  checkoutSlotPickerRow: {
    gap: 6,
    marginTop: 2,
  },
  checkoutSlotChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  checkoutSlotChipSelected: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FF5252',
  },
  checkoutSlotChipText: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '500',
  },
  checkoutSlotChipTextSelected: {
    fontWeight: '800',
    color: '#FF5252',
  },

  // PAYMENT METHODS
  checkoutPaymentMethodsWrap: {
    gap: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  checkoutPaymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 11,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  checkoutPaymentMethodRowSelected: {
    borderColor: '#FF5252',
    backgroundColor: '#FFF5F5',
  },
  checkoutPaymentRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutPaymentRadioSelected: {
    borderColor: '#FF5252',
  },
  checkoutPaymentRadioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#FF5252',
  },
  checkoutPaymentMethodLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  checkoutPaymentMethodLabelSelected: {
    color: '#FF5252',
    fontWeight: '800',
  },

  // METHOD DETAILS
  checkoutMethodDetailBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginTop: 8,
  },
  checkoutUpiAppsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  checkoutUpiAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  checkoutUpiAppBtnActive: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FF5252',
  },
  checkoutUpiAppBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  checkoutUpiAppBtnTextActive: {
    color: '#FF5252',
    fontWeight: '800',
  },
  checkoutUpiInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkoutUpiVerifyBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  checkoutUpiVerifyBtnDone: {
    backgroundColor: '#059669',
  },
  checkoutUpiVerifyBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  checkoutBankPickerGrid: {
    gap: 6,
  },
  checkoutBankChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  checkoutBankChipActive: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FF5252',
  },
  checkoutBankChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  checkoutBankChipTextActive: {
    color: '#FF5252',
    fontWeight: '800',
  },

  checkoutWalletBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkoutWalletBalLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  checkoutWalletBalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#059669',
    marginTop: 2,
  },
  checkoutWalletTopUpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  checkoutWalletTopUpBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  checkoutWalletNoticeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  checkoutWalletNoticeTextSuccess: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#065F46',
    flex: 1,
  },
  checkoutWalletNoticeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  checkoutWalletNoticeTextWarning: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#DC2626',
    flex: 1,
  },

  checkoutPricingSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  checkoutSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkoutSummaryLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  checkoutSummaryValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  checkoutSummaryNote: {
    fontSize: 10,
    color: '#059669',
    marginTop: 6,
  },

  checkoutPrivacyAssuranceBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    marginBottom: 4,
    alignItems: 'flex-start',
  },
  checkoutPrivacyAssuranceText: {
    fontSize: 11,
    color: '#065F46',
    flex: 1,
    lineHeight: 16,
  },

  checkoutModalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#FEE2E2',
    backgroundColor: '#FFFFFF',
  },
  checkoutConfirmBtn: {
    backgroundColor: '#FF5252',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 4px 12px rgba(255, 82, 82, 0.3)' }
      : {
          shadowColor: '#FF5252',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 4,
        }),
  },
  checkoutConfirmBtnDisabled: {
    opacity: 0.65,
  },
  checkoutConfirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // PROCESSING MODAL
  procModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  processModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 12px 24px rgba(0, 0, 0, 0.25)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.25,
          shadowRadius: 24,
          elevation: 10,
        }),
  },
  processTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 14,
    textAlign: 'center',
  },
  processSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  processStepRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },
  processDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  processDotActive: {
    backgroundColor: '#FF5252',
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
});

export default CartScreen;
