import { useState, useEffect, useRef, useMemo, useCallback } from "react";

// ============= API CONFIGURATION =============
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:50001/api';  // FIXED: Changed from 5001 to 50001

const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/uploads')) {
    const baseUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api', '')
      : 'http://localhost:50001';
    return `${baseUrl}${path}`;
  }
  if (path.startsWith('/products')) return path;
  const baseUrl = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '')
    : 'http://localhost:50001';
  return `${baseUrl}${path}`;
};

const api = {
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options.headers },
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/products?${queryString}`);
  },
  async getCategories() {
    return this.request('/products/categories/list');
  },
  async calculatePrice(productId, customizations) {
    return this.request(`/products/${productId}/calculate-price`, {
      method: 'POST',
      body: JSON.stringify(customizations)
    });
  },
  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  },
  async initializePayment(paymentData) {
    return this.request('/payment/initialize', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  }
};

// ============= STATIC FALLBACK DATA =============
const PRODUCTS = {
  chairs: [
    { id: "ch1", _id: "ch1", name: "Athena Sofa Chair", price: 536500, desc: "A multifunctional 3 seater Sofa that transforms to a queen size bed", img: "/products/athena2.png", mainImage: "/products/athena2.png", gallery: ["/products/athena2.png", "/products/athena3.png", "/products/athena4.png"], variantImages: { "Blue": "/products/athena2.png", "Grey": "/products/athena3.png", "Mustard": "/products/athena4.png" }, frame: ["Matte black Metal", "Gloss Black Metal"], frameOptions: ["Matte black Metal", "Gloss Black Metal"], fabrics: ["Linen", "Velvet", "Leather", "Bouclé"], colors: { "Linen": ["#3186e2","#434343","#e2ad2f","#8B8178"], "Velvet": ["#2C2C2C","#3D3530","#4A4540","#1A1A2E"], "Leather": ["#2C2C2C","#5C4033","#8B7355","#D4C5B2"] }, details: { description: "The Athena is designed for modern living — a beautifully sculpted 3-seater sofa that effortlessly transforms into a queen-size bed. Perfect for compact spaces without compromising on style or comfort.", dimensions: "Sofa: 220cm × 90cm × 85cm · Bed: 220cm × 150cm × 45cm", weight: "68 kg", leadTime: "4–6 weeks", care: "Professional upholstery cleaning recommended. Spot clean with mild detergent. Avoid direct sunlight to preserve fabric colour." }, priceModifiers: { fabricModifiers: { "Linen": 0, "Velvet": 25000, "Leather": 50000 } }, category: "chairs" },
  ],
  tables: [
    { id: "tb1", _id: "tb1", name: "Water Spring", price: 210000, desc: "This is Glass Center table inspired by the formation of a water podule with spring metal spring base. It may not be for every one but it will surely leave people asking 'where did you get your table'", img: "/products/waterspring.png", mainImage: "/products/waterspring.png", gallery: ["/products/waterspring.png"], materials: ["Tempered Glass top"], fabrics: [], colors: {}, details: { description: "Hewn from a single block of natural stone, the PLINTH is a dining table that commands presence. Each slab is unique — veining patterns will vary, making every piece one of a kind.", dimensions: "200cm × 100cm × 75cm", weight: "120 kg", leadTime: "6–8 weeks", care: "Seal annually with stone-specific sealant. Wipe spills immediately. Use coasters and trivets." }, priceModifiers: {}, category: "tables" },
    { id: "tb2", _id: "tb2", name: "Magna Work Table", price: 85900, desc: "A multifunctional work table with in built socket and a cable management rack", img: "/products/magnaworktable.png", mainImage: "/products/magnaworktable.png", gallery: ["/products/magnaworktable.png"], materials: ["Oak", "Walnut", "Ash"], fabrics: [], colors: {}, details: { description: "Three floating planes of solid hardwood, stacked with deliberate asymmetry. The STRATUM plays with perspective — it looks different from every angle.", dimensions: "45cm × 45cm × 55cm", weight: "8.6 kg", leadTime: "3–4 weeks", care: "Dust regularly. Apply wood oil every 6 months. Avoid prolonged moisture exposure." }, priceModifiers: { materialModifiers: { "Oak": 0, "Walnut": 15000, "Ash": 10000 } }, category: "tables" },
    { id: "tb3", _id: "tb3", name: "Magna 2 toned center Table", price: 138900, desc: "Cantilevered desk in blackened steel & glass", img: "/products/Magnacenter.png", mainImage: "/products/Magnacenter.png", gallery: ["/products/Magnacenter.png"], materials: ["Wood & metal"], fabrics: [], colors: {}, details: { description: "The Magna center table a a simple and functional center made of a metal frame and 2 toned wood. It a wooden top and 2 draws for storage underneath .", dimensions: "width; 26inches  × lenght; 43inches × height ; 18inches", weight: "42 kg", leadTime: "5-7 working days", care: " Steel: wipe with dry cloth. Avoid abrasive cleaners." }, priceModifiers: {}, category: "tables" },
  ],
  lamps: [
    { id: "lm1", _id: "lm1", name: "ATLAS", price: 57000, desc: "Ring pendant light, brushed brass finish", img: "/products/halo.jpg", mainImage: "/products/halo.jpg", gallery: ["/products/halo.jpg","/products/halo2.jpg"], materials: [ "Matte Black", "Gloss Black"], fabrics: [], colors: {}, sizes: ["S · 20 inches"], details: { description: "A perfect circle of light. The HALO pendant casts a warm, even glow through its LED-integrated ring, creating atmosphere without visual clutter.", dimensions: "S: Ø30cm · M: Ø50cm · L: Ø80cm · Cable: 150cm adjustable", weight: "S: 1.8 kg · M: 3.2 kg · L: 5.4 kg", leadTime: "2–3 weeks", care: "Dust with a microfibre cloth. Do not use chemical cleaners on metal finish." }, priceModifiers: { sizeModifiers: { "S · 30cm": 0, "M · 50cm": 15000, "L · 80cm": 30000 } }, category: "lamps" },
  ],
  tvconsole: [
    { id: "tv1", _id: "tv1", name: "Magna 2 Tone TV Console", price: 168900, desc: "Low platform bed, solid walnut frame", img: "/products/magnaTV.png", mainImage: "/products/magnaTV.png", gallery: ["/products/magnaTV.png","/products/magnatv3.png","/products/magnatv2.jpg"], materials: ["Wood & metal"], sizes: ["MAXI", "Mini"], details: { description: "The magna 2 toned Tv console is a highly functional TV console with a built in socket and storage cabinet. The magna console was intentinally built to Beautify your Tv area and make it clutter free. It has a sturdy metal base", dimensions: " MAXI : Length; 179cm depth; 42cm  height; 55cm ·  Mini: Length; 122cm depth; 42cm  height; 55cm· ", weight: "Maxi: 55 kg · Mini: 40 kg", leadTime: "5-7 working days", care: "Wood: dust and oil seasonally. Upholstery: professional cleaning recommended annually." }, priceModifiers: { sizeModifiers: { "MAXI": 0, "Mini": -20000 } }, category: "tvconsole" },
  ],
};

const COLOR_NAMES = {
  "#F5F0EB": "Ivory", "#E8E0D8": "Sand", "#2C2C2C": "Charcoal", "#8B8178": "Stone",
  "#3D3530": "Espresso", "#4A4540": "Slate", "#1A1A2E": "Midnight", "#E8DDD0": "Oat",
  "#C8BEB0": "Driftwood", "#5C4033": "Cognac", "#8B7355": "Camel", "#D4C5B2": "Bone",
};

const formatPrice = (n) => "₦" + n.toLocaleString();

// Keep all your THEMES exactly as they are...
const THEMES = {
  light: { background: "#FAFAF8", surface: "#FFFFFF", surfaceAlt: "#F0EDEA", text: "#2C2C2C", textSecondary: "#666666", textMuted: "#999999", border: "#EEEEEE", borderDark: "#DDDDDD", accent: "#2C2C2C", accentText: "#F5F0EB", hover: "#444444", card: "#FFFFFF", cardHover: "#F8F8F6", icon: "#2C2C2C", iconHover: "#000000", success: "#2C7A2C", error: "#D32F2F", overlay: "rgba(0,0,0,0.3)", lightbox: "rgba(0,0,0,0.92)", placeholder: "#EDEAE6", scrollbar: "#DDDDDD" },
  dark: { background: "#1A1A1A", surface: "#2D2D2D", surfaceAlt: "#242424", text: "#F5F5F5", textSecondary: "#AAAAAA", textMuted: "#888888", border: "#3D3D3D", borderDark: "#4D4D4D", accent: "#F5F0EB", accentText: "#1A1A1A", hover: "#666666", card: "#2D2D2D", cardHover: "#353535", icon: "#F5F5F5", iconHover: "#FFFFFF", success: "#4CAF50", error: "#F44336", overlay: "rgba(0,0,0,0.7)", lightbox: "rgba(0,0,0,0.95)", placeholder: "#3D3D3D", scrollbar: "#4D4D4D" }
};

// Keep all your icon components exactly as they are...
const CartIcon = ({ theme }) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/></svg>);
const CloseIcon = ({ theme }) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg>);
const ArrowIcon = ({ dir = "right", theme }) => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ transform: dir === "left" ? "rotate(180deg)" : "none" }}><path d="M5 12h14M12 5l7 7-7 7"/></svg>);
const MenuIcon = ({ theme }) => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 12h18M3 6h18M3 18h18"/></svg>);
const ExpandIcon = ({ theme }) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>);
const SunIcon = ({ theme }) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>);
const MoonIcon = ({ theme }) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>);

const ProductImage = ({ src, alt, style, onError, theme }) => {
  const [error, setError] = useState(false);
  if (!src || error) {
    return <div style={{ ...style, display: "flex", alignItems: "center", justifyContent: "center", background: THEMES[theme].placeholder }}><span style={{ fontSize: 14, color: THEMES[theme].textMuted }}>Image unavailable</span></div>;
  }
  return <img src={src} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", ...style }} onError={() => setError(true)} />;
};
// Success Modal Component
const SuccessModal = ({ orderNumber, customerName, email, total, reference, onClose }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '450px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          backgroundColor: '#2C7A2C',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#2C2C2C' }}>
          Order Successful!
        </h2>
        
        <div style={{ marginBottom: '20px', color: '#666' }}>
          <p style={{ marginBottom: '8px' }}>
            <strong>Order Number:</strong> {orderNumber}
          </p>
          <p style={{ marginBottom: '8px' }}>
            <strong>Customer:</strong> {customerName}
          </p>
          <p style={{ marginBottom: '8px' }}>
            <strong>Email:</strong> {email}
          </p>
          <p style={{ marginBottom: '8px' }}>
            <strong>Total Paid:</strong> {formatPrice(total)}
          </p>
          <p style={{ marginBottom: '16px', fontSize: '12px', color: '#999' }}>
            Reference: {reference}
          </p>
        </div>
        
        <p style={{ marginBottom: '24px', color: '#666', fontSize: '14px' }}>
          Thank you for shopping with CASABLNK!<br />
          You will receive a confirmation email shortly.
        </p>
        
        <button
          onClick={onClose}
          style={{
            backgroundColor: '#2C2C2C',
            color: 'white',
            border: 'none',
            padding: '12px 32px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
};
// ============= MAIN COMPONENT =============
export default function CasablnkApp() {
  const [view, setView] = useState("home");
  const [category, setCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [fadeIn, setFadeIn] = useState(true);
  const [customization, setCustomization] = useState({});
  const [notification, setNotification] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [lightbox, setLightbox] = useState(null);
  const [shopFilter, setShopFilter] = useState("all");
  const [heroSlide, setHeroSlide] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('casablnk_darkmode');
    return saved ? JSON.parse(saved) : false;
  });
  
  // NEW: Backend integration states
  const [apiProducts, setApiProducts] = useState({});
  const [categoriesList, setCategoriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dynamicPrice, setDynamicPrice] = useState(0);
  const [priceLoading, setPriceLoading] = useState(false);
  const [useApi, setUseApi] = useState(true);
  
  const heroImages = ["/casa 103.png", "/table2.png", "/chair2.png", "/waterspring.jpg"];
  const currentTheme = darkMode ? 'dark' : 'light';
  const theme = THEMES[currentTheme];
  
  // NEW: Fetch from backend on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [categoriesRes, productsRes] = await Promise.all([
          api.getCategories(),
          api.getProducts({ limit: 100 })
        ]);
        
        if (categoriesRes.success) setCategoriesList(categoriesRes.data);
        if (productsRes.success) {
          const grouped = {};
          productsRes.data.forEach(p => {
            if (!grouped[p.category]) grouped[p.category] = [];
            grouped[p.category].push({ ...p, id: p._id, img: p.mainImage });
          });
          setApiProducts(grouped);
        }
        setUseApi(true);
      } catch (error) {
        console.error('Backend connection failed, using offline mode:', error);
        setUseApi(false);
        setNotification('📡 Offline Mode - Using local data');
        setTimeout(() => setNotification(null), 3000);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  
  // Get current products (API or fallback)
  const products = useApi && Object.keys(apiProducts).length > 0 ? apiProducts : PRODUCTS;
  
  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('casablnk_cart');
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch (e) {}
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem('casablnk_cart', JSON.stringify(cart));
  }, [cart]);
  
  useEffect(() => {
    localStorage.setItem('casablnk_darkmode', JSON.stringify(darkMode));
  }, [darkMode]);
  
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      document.body.style.background = THEMES.dark.background;
    } else {
      document.body.classList.remove('dark-mode');
      document.body.style.background = THEMES.light.background;
    }
  }, [darkMode]);

  useEffect(() => {
    if (heroImages.length === 0) return;
    const timer = setInterval(() => setHeroSlide((p) => (p + 1) % heroImages.length), 4000);
    return () => clearInterval(timer);
  }, []);
// Set initial history state
useEffect(() => {
  window.history.replaceState({ view: "home" }, '', '');
}, []);

// Handle browser back/forward navigation
useEffect(() => {
  const handlePopState = () => {
    setView("home");
    setCategory(null);
    setSelectedProduct(null);
    setFadeIn(true);
  };
  window.addEventListener('popstate', handlePopState);
  return () => window.removeEventListener('popstate', handlePopState);
}, []);
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setLightbox(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // NEW: Calculate price using backend or fallback
  useEffect(() => {
    const calculatePrice = async () => {
      if (!selectedProduct) { setDynamicPrice(0); return; }
      
      try {
        setPriceLoading(true);
        if (useApi) {
          const result = await api.calculatePrice(selectedProduct._id || selectedProduct.id, {
            material: customization.material,
            fabric: customization.fabric,
            size: customization.size,
            variant: selectedVariant
          });
          if (result.success) {
            setDynamicPrice(result.data.finalPrice);
            return;
          }
        }
        // Fallback calculation
        let base = selectedProduct.price || 0;
        let mod = 0;
        const pm = selectedProduct.priceModifiers || {};
        if (customization.material && pm.materialModifiers) mod += pm.materialModifiers[customization.material] || 0;
        if (customization.fabric && pm.fabricModifiers) mod += pm.fabricModifiers[customization.fabric] || 0;
        if (customization.size && pm.sizeModifiers) mod += pm.sizeModifiers[customization.size] || 0;
        setDynamicPrice(base + mod);
      } catch (error) {
        setDynamicPrice(selectedProduct.price || 0);
      } finally {
        setPriceLoading(false);
      }
    };
    calculatePrice();
  }, [selectedProduct, customization, selectedVariant, useApi]);

  const navigate = useCallback((v, cat = null, prod = null) => {
  if (isNavigating) return;
  setIsNavigating(true);
  setFadeIn(false);
  
  // Push state to browser history
  window.history.pushState({ view: v, category: cat, product: prod?.name }, '', '');
  
  setTimeout(() => {
    setView(v); setCategory(cat); setSelectedProduct(prod);
    if (prod) {
      const c = {};
      if (prod.materials?.length) c.material = prod.materials[0];
      if (prod.fabrics?.length) c.fabric = prod.fabrics[0];
      if (prod.colors && prod.fabrics?.length) { 
        const fab = prod.fabrics[0]; 
        if (prod.colors[fab]?.length) c.color = prod.colors[fab][0]; 
      }
      if (prod.sizes?.length) c.size = prod.sizes[0];
      if (prod.frameOptions?.length) c.frame = prod.frameOptions[0];
      setCustomization(c); setGalleryIndex(0);
      if (prod.variantImages) setSelectedVariant(Object.keys(prod.variantImages)[0]);
      else setSelectedVariant(null);
    }
    setFadeIn(true); setMobileMenu(false); setIsNavigating(false);
  }, 300);
}, [isNavigating]);

  const getDisplayImage = useCallback(() => {
    if (!selectedProduct) return "";
    if (selectedProduct.variantImages && selectedVariant) return selectedProduct.variantImages[selectedVariant];
    if (selectedProduct.gallery?.length) return selectedProduct.gallery[galleryIndex] || selectedProduct.mainImage || selectedProduct.img;
    return selectedProduct.mainImage || selectedProduct.img;
  }, [selectedProduct, selectedVariant, galleryIndex]);

  const getAllImages = useMemo(() => {
    if (!selectedProduct) return [];
    const imageSet = new Set();
    if (selectedProduct.mainImage) imageSet.add(selectedProduct.mainImage);
    if (selectedProduct.img) imageSet.add(selectedProduct.img);
    if (selectedProduct.gallery) selectedProduct.gallery.forEach(img => imageSet.add(img));
    if (selectedProduct.variantImages) Object.values(selectedProduct.variantImages).forEach(img => imageSet.add(img));
    return Array.from(imageSet);
  }, [selectedProduct]);

  const addToCart = useCallback(() => {
    if (!selectedProduct) return;
    const cartItem = { 
      ...selectedProduct, 
      _id: selectedProduct._id || selectedProduct.id,
      customization: { ...customization, variant: selectedVariant, colorName: customization.color ? (COLOR_NAMES[customization.color] || customization.color) : null },
      price: dynamicPrice, originalPrice: selectedProduct.price, cartId: Date.now() + Math.random()
    };
    setCart((prev) => [...prev, cartItem]);
    setNotification(`Added to bag - ${formatPrice(dynamicPrice)}`);
    setTimeout(() => setNotification(null), 2000);
  }, [selectedProduct, customization, selectedVariant, dynamicPrice]);
  
  const removeFromCart = useCallback((cartId) => setCart((prev) => prev.filter((i) => i.cartId !== cartId)), []);
  const cartSubtotal = useMemo(() => cart.reduce((s, i) => s + i.price, 0), [cart]);
const cartVAT = useMemo(() => cartSubtotal * 0.075, [cartSubtotal]);
const cartTotal = useMemo(() => cartSubtotal + cartVAT, [cartSubtotal, cartVAT]);

  // NEW: Real checkout
// NEW: Real checkout with success prompt
const handlePaystack = useCallback(async () => {
  const emailInput = document.querySelector('#checkout-email');
  const nameInput = document.querySelector('#checkout-name');
  const phoneInput = document.querySelector('#checkout-phone');
  const addressInput = document.querySelector('#checkout-address');
  
  const email = emailInput?.value;
  const name = nameInput?.value;
  const phone = phoneInput?.value;
  const address = addressInput?.value;
  
  if (!email || !name || !phone || !address) {
    setNotification('Please fill in all required fields');
    setTimeout(() => setNotification(null), 3000);
    return;
  }
  
  if (cart.length === 0) {
    setNotification('Your cart is empty');
    setTimeout(() => setNotification(null), 3000);
    return;
  }
  
  try {
    setNotification('Creating your order...');
    
    // 1. Create the order in your backend
const orderResponse = await fetch(`${API_BASE_URL}/orders`, {      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { name, email, phone, address },
        items: cart.map(item => ({
          productId: item._id || item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          customization: item.customization || {}
        })),
        subtotal: cartSubtotal,
        vat: cartVAT,
        total: cartTotal,
        notes: cart.map(item => item.customization?.notes).filter(Boolean).join('; ')
      })
    });
    
    const orderResult = await orderResponse.json();
    
    if (!orderResult.success) {
      throw new Error(orderResult.message || 'Failed to create order');
    }
    
    const orderNumber = orderResult.data.orderNumber;
    
    // 2. Initialize Paystack payment
    const handler = window.PaystackPop.setup({
      key: 'pk_test_1ed1883bf4fec4b04d5aaaa5e263ffeed6499f6c',
      email: email,
      amount: cartTotal * 100,
      currency: 'NGN',
      ref: `CB-${orderNumber}-${Date.now()}`,
      metadata: {
        orderNumber: orderNumber,
        customerName: name
      },
      onSuccess: (transaction) => {
  // Clear ALL notifications immediately
  setNotification(null);
  
  // Show success alert
  const successMessage = `
    ✅ ORDER SUCCESSFUL!
    
    Order Number: ${orderNumber}
    Customer: ${name}
    Email: ${email}
    Total Paid: ${formatPrice(cartTotal)}
    Payment Reference: ${transaction.reference}
    
    Thank you for shopping with CASABLNK!
    You will receive a confirmation email shortly.
  `;
  
  alert(successMessage);
  
  // Clear cart and close checkout
  setCart([]);
  setShowCart(false);
  setShowCheckout(false);
  
  // Show brief success notification then clear
  setNotification(`✅ Order #${orderNumber} Confirmed!`);
  
  // Navigate to home and clear notification
  setTimeout(() => {
    navigate("home");
    setNotification(null);
  }, 2000);
},
      onClose: () => {
        // User closed the payment modal
        setNotification(`⏳ Payment not completed. Order #${orderNumber} saved as pending.`);
        setShowCart(false);
        setShowCheckout(false);
        setTimeout(() => setNotification(null), 5000);
      },
      onError: (error) => {
        console.error('Payment error:', error);
        setNotification(`❌ Payment failed. Order #${orderNumber} saved. Please try again.`);
        setTimeout(() => setNotification(null), 5000);
      }
    });
    
    handler.openIframe();
    
    // Clear the "Creating order" notification once Paystack opens
    setTimeout(() => setNotification(null), 500);
    
  } catch (error) {
    console.error('Checkout error:', error);
    setNotification('Checkout failed: ' + error.message);
    setTimeout(() => setNotification(null), 5000);
  }
}, [cart, cartSubtotal, cartVAT, cartTotal, navigate]);

  const categories = useMemo(() => {
    if (categoriesList.length > 0) {
      return categoriesList.map(cat => ({ key: cat.category, label: cat.label || cat.category, tagline: cat.tagline || '' }));
    }
    return [
      { key: "chairs", label: "Chairs", tagline: "Sculpted for stillness" },
      { key: "tables", label: "Tables", tagline: "Grounded forms" },
      { key: "lamps", label: "Lamps", tagline: "Light, refined" },
      { key: "tvconsole", label: "TV Console", tagline: "Entertainment, elevated" },
    ];
  }, [categoriesList]);

  const getCategoryLabel = useCallback((catKey) => {
    const cat = categories.find(c => c.key === catKey);
    return cat ? cat.label : catKey;
  }, [categories]);

  const getColorName = useCallback((colorHex) => COLOR_NAMES[colorHex] || colorHex || "Selected", []);

  // Keep your getStyles function exactly as is...
  const getStyles = () => ({
   app: { 
  fontFamily: "'Karla', sans-serif", 
  color: theme.text, 
  background: theme.background, 
  minHeight: "100vh", 
  position: "relative",
  width: "100%",
  margin: 0,
  padding: 0
},
    notification: { position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)", background: theme.accent, color: theme.accentText, padding: "10px 28px", fontSize: 13, letterSpacing: ".06em", zIndex: 9999, animation: "notifIn .3s ease", fontFamily: "'Karla', sans-serif" },
    // ... (keep all your existing styles - I'm truncating for brevity but DON'T delete them)
    lbOverlay: { position: "fixed", inset: 0, background: theme.lightbox, zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", animation: "lbIn .25s ease", cursor: "zoom-out" },
    lbContent: { position: "relative", maxWidth: "90vw", maxHeight: "90vh", display: "flex", alignItems: "center", justifyContent: "center" },
    lbImage: { maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain", display: "block", cursor: "default" },
    lbClose: { position: "absolute", top: -40, right: 0, background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 8, zIndex: 2 },
    lbNav: { position: "absolute", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.85)", border: "none", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 2, transition: "background .2s" },
    lbCounter: { position: "absolute", bottom: -32, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.5)", fontSize: 12, letterSpacing: ".1em", fontFamily: "'Karla', sans-serif" },
    nav: { position: "sticky", top: 0, zIndex: 100, background: `${theme.background}E6`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${theme.border}` },
   navInner: { maxWidth: "100vw", margin: "0 auto", padding: "0 3%", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" },
    logo: { fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 500, letterSpacing: ".18em", cursor: "pointer", position: "absolute", left: "50%", transform: "translateX(-50%)", color: theme.text },
    navLinks: { display: "flex", gap: 32 },
    navLink: { background: "none", border: "none", fontFamily: "'Karla', sans-serif", fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer", color: theme.text, transition: "opacity .2s" },
    menuBtn: { background: "none", border: "none", cursor: "pointer", color: theme.icon, display: "none", padding: 4 },
    cartBtn: { background: "none", border: "none", cursor: "pointer", color: theme.icon, position: "relative", padding: 4 },
    cartBadge: { position: "absolute", top: -4, right: -8, background: theme.accent, color: theme.accentText, fontSize: 9, width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500 },
    mobileMenuPanel: { padding: "8px 24px 16px", display: "flex", flexDirection: "column", gap: 4, borderTop: `1px solid ${theme.border}` },
    mobileMenuItem: { background: "none", border: "none", fontFamily: "'Karla', sans-serif", fontSize: 13, letterSpacing: ".08em", textTransform: "uppercase", cursor: "pointer", color: theme.text, textAlign: "left", padding: "8px 0" },
   main: { maxWidth: "100vw", margin: "0 auto", padding: "0 3%" },
hero: { minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 60, padding: "60px 0", position: "relative", width: "100%" },
    heroContent: { maxWidth: 520, animation: "fadeUp .8s ease forwards" },
    heroSub: { fontFamily: "'Karla', sans-serif", fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", color: theme.textMuted, marginBottom: 20 },
    heroTitle: { fontFamily: "'Cormorant Garamond', serif", color: theme.text, fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 300, lineHeight: 1.1, marginBottom: 24, letterSpacing: "-.01em" },
    heroDesc: { fontSize: 15, lineHeight: 1.7, color: theme.textSecondary, marginBottom: 40, fontWeight: 300, maxWidth: 380 },
    heroCta: { background: theme.accent, color: theme.accentText, border: "none", padding: "16px 48px", fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Karla', sans-serif", transition: "background .3s" },
    catSection: { padding: "80px 0" },
    sectionTitle: { fontFamily: "'Cormorant Garamond', serif", color: theme.textSecondary, fontSize: 32, fontWeight: 300, marginBottom: 48, letterSpacing: ".02em" },
    catGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 },
    catCard: { background: theme.surfaceAlt, padding: 0, cursor: "pointer", transition: "all .4s ease", animation: "fadeUp .6s ease forwards", opacity: 0, overflow: "hidden" },
    catCardInner: { padding: "28px 20px", position: "relative" },
    catNum: { fontFamily: "'Cormorant Garamond', serif", fontSize: 11, color: theme.textMuted, display: "block", marginBottom: 16, letterSpacing: ".1em" },
    catName: { fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 400, marginBottom: 4, color: theme.text },
    catTagline: { fontSize: 11, color: theme.textMuted, fontWeight: 300, letterSpacing: ".04em" },
    catArrow: { position: "absolute", bottom: 20, right: 20, opacity: 0.4, color: theme.text },
    ethosSection: { padding: "80px 0 100px", borderTop: `1px solid ${theme.border}` },
    ethosGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 48 },
    ethosItem: {},
    ethosNum: { fontSize: 10, color: theme.textMuted, letterSpacing: ".15em", display: "block", marginBottom: 16 },
    ethosTitle: { fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 400, marginBottom: 12, color: theme.text },
    ethosText: { fontSize: 13, lineHeight: 1.7, color: theme.textSecondary, fontWeight: 300 },
    catHeader: { padding: "40px 0 32px" },
    backBtn: { background: "none", border: "none", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: theme.textMuted, fontSize: 12, letterSpacing: ".06em", fontFamily: "'Karla', sans-serif", marginBottom: 24 },
    catHeaderTitle: { fontFamily: "'Cormorant Garamond', serif", color: theme.text, fontSize: 40, fontWeight: 300 },
    catHeaderSub: { fontSize: 13, color: theme.textMuted, fontWeight: 300, marginTop: 8 },
    prodGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32, paddingBottom: 80 },
    prodCard: { cursor: "pointer", transition: "transform .4s ease", animation: "fadeUp .6s ease forwards", opacity: 0 },
    prodImgWrap: { overflow: "hidden", marginBottom: 20 },
    prodPlaceholder: { width: "100%", aspectRatio: "4/3", background: theme.placeholder, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
    prodName: { fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 400, letterSpacing: ".06em", marginBottom: 6, transition: "letter-spacing .3s", color: theme.text },
    prodDesc: { fontSize: 12, color: theme.textMuted, fontWeight: 300, lineHeight: 1.5, marginBottom: 8 },
    prodPrice: { fontSize: 14, fontWeight: 400, letterSpacing: ".02em", color: theme.text },
    productDetail: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, paddingBottom: 40 },
    pdImage: {},
    pdPlaceholder: { width: "100%", aspectRatio: "1/1", background: theme.placeholder, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", position: "relative", overflow: "hidden", paddingBottom: 20, cursor: "zoom-in" },
    expandHint: { position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.8)", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3, opacity: 0.6, transition: "opacity .2s" },
    imgNav: { position: "absolute", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.8)", border: "none", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 3 },
    pdCustomPreview: { display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", padding: "0 20px" },
    previewTag: { fontSize: 10, letterSpacing: ".06em", padding: "4px 12px", background: theme.surface, border: `1px solid ${theme.border}`, fontFamily: "'Karla', sans-serif", color: theme.text },
    pdInfo: { paddingTop: 20 },
    pdName: { fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 300, letterSpacing: ".08em", marginBottom: 12, color: theme.text },
    pdDesc: { fontSize: 14, color: theme.textSecondary, fontWeight: 300, lineHeight: 1.6, marginBottom: 8 },
    pdPrice: { fontSize: 20, fontWeight: 400, marginBottom: 32, color: theme.text },
    customSection: { marginBottom: 32 },
    customLabel: { fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 400, marginBottom: 8, color: theme.text },
    divider: { height: 1, background: theme.border, marginBottom: 24 },
    optGroup: { marginBottom: 24 },
    optLabel: { fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: theme.textMuted, display: "block", marginBottom: 10, fontWeight: 400 },
    optBtns: { display: "flex", flexWrap: "wrap", gap: 8 },
    optBtn: { background: "none", border: `1px solid ${theme.border}`, padding: "8px 18px", fontSize: 12, cursor: "pointer", fontFamily: "'Karla', sans-serif", letterSpacing: ".04em", color: theme.textSecondary, transition: "all .2s" },
    optBtnActive: { borderColor: theme.accent, color: theme.accent, fontWeight: 500 },
    swatchRow: { display: "flex", gap: 12, flexWrap: "wrap" },
    swatch: { width: 32, height: 32, border: "none", cursor: "pointer", transition: "transform .2s", padding: 0 },
    textarea: { width: "100%", minHeight: 60, border: `1px solid ${theme.border}`, background: theme.surface, padding: "12px 14px", fontSize: 13, fontFamily: "'Karla', sans-serif", color: theme.text, resize: "vertical", outline: "none" },
    addBtn: { width: "100%", background: theme.accent, color: theme.accentText, border: "none", padding: "18px 48px", fontSize: 13, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Karla', sans-serif", transition: "background .3s" },
    overlay: { position: "fixed", inset: 0, background: theme.overlay, zIndex: 200, display: "flex", justifyContent: "flex-end" },
    cartPanel: { width: "min(420px, 90vw)", background: theme.surface, height: "100%", display: "flex", flexDirection: "column", animation: "slideIn .3s ease" },
    cartHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: `1px solid ${theme.border}` },
    cartTitle: { fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 400, color: theme.text },
    closeBtn: { background: "none", border: "none", cursor: "pointer", color: theme.textMuted, padding: 4 },
    cartEmpty: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: "40px 20px" },
    cartEmptyText: { fontSize: 14, color: theme.textMuted, fontWeight: 300 },
    cartEmptyBtn: { background: "none", border: `1px solid ${theme.accent}`, color: theme.accent, padding: "12px 32px", fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Karla', sans-serif", transition: "all .3s" },
    cartItems: { flex: 1, overflowY: "auto", padding: "16px 24px" },
    cartItem: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "16px 0", borderBottom: `1px solid ${theme.border}` },
    cartItemName: { fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontWeight: 400, marginBottom: 4, color: theme.text },
    cartItemSpecs: { fontSize: 11, color: theme.textMuted, fontWeight: 300 },
    cartItemNotes: { fontSize: 11, color: theme.textMuted, fontStyle: "italic", marginTop: 4 },
    cartItemPrice: { fontSize: 13, marginTop: 6, color: theme.text },
    removeBtn: { background: "none", border: "none", cursor: "pointer", color: theme.textMuted, padding: 4, marginTop: 2 },
    cartFooter: { padding: "20px 24px", borderTop: `1px solid ${theme.border}` },
    cartTotal: { display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 500, marginBottom: 16, color: theme.text },
    checkoutBtn: { width: "100%", background: theme.accent, color: theme.accentText, border: "none", padding: "16px", fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Karla', sans-serif", transition: "background .3s" },
    checkoutForm: { flex: 1, overflowY: "auto", padding: "24px" },
    formGroup: { marginBottom: 20 },
    formLabel: { fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: theme.textMuted, display: "block", marginBottom: 6, fontWeight: 400 },
    formInput: { width: "100%", border: `1px solid ${theme.border}`, background: theme.surface, padding: "12px 14px", fontSize: 13, fontFamily: "'Karla', sans-serif", color: theme.text, outline: "none" },
    orderSummary: { background: theme.surfaceAlt, padding: "20px", marginBottom: 24, marginTop: 8 },
    summaryTitle: { fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontWeight: 400, marginBottom: 12, color: theme.text },
    summaryItem: { display: "flex", justifyContent: "space-between", fontSize: 12, color: theme.textSecondary, padding: "4px 0" },
    summaryTotal: { borderTop: `1px solid ${theme.border}`, marginTop: 8, paddingTop: 8, fontWeight: 500, color: theme.text, fontSize: 14 },
    paystackBtn: { width: "100%", background: theme.accent, color: theme.accentText, border: "none", padding: "16px", fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Karla', sans-serif", transition: "background .3s", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 12 },
    paystackBadge: { fontSize: 9, background: "rgba(255,255,255,.15)", padding: "3px 8px", letterSpacing: ".06em" },
    backToCartBtn: { width: "100%", background: "none", border: `1px solid ${theme.border}`, color: theme.textSecondary, padding: "12px", fontSize: 12, letterSpacing: ".06em", cursor: "pointer", fontFamily: "'Karla', sans-serif", transition: "all .3s" },
   footer: { 
  borderTop: `1px solid ${theme.border}`, 
  background: theme.background,
  width: "100%"
},
  footerInner: { maxWidth: "100vw", margin: "0 auto", padding: "60px 3%", textAlign: "center" },
    footerLogo: { fontFamily: "'Cormorant Garamond', serif", fontSize: 24, letterSpacing: ".2em", marginBottom: 20, fontWeight: 400, color: theme.text },
    footerLinks: { display: "flex", justifyContent: "center", gap: 32, marginBottom: 24, flexWrap: "wrap" },
    footerLink: { fontSize: 12, color: theme.textMuted, letterSpacing: ".06em", textDecoration: "none", cursor: "pointer" },
    footerCopy: { fontSize: 11, color: theme.textMuted, letterSpacing: ".04em" },
    themeToggle: { background: "none", border: `1px solid ${theme.border}`, borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: theme.icon, transition: "all .3s ease", marginLeft: 16 }
  });

  const styles = getStyles();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: theme.background, fontFamily: "'Karla', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${theme.border}`, borderTopColor: theme.accent, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: theme.textSecondary }}>Loading CASABLNK...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      
      <style>
        
        {`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Karla:wght@300;400;500&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        body{background: ${theme.background}; transition: background 0.3s ease, color 0.3s ease}
        ::selection{background: ${theme.accent}; color: ${theme.accentText}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
        @keyframes notifIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes lbIn{from{opacity:0}to{opacity:1}}
        .fade-enter{animation:fadeUp .6s ease forwards}
        .prod-card:hover{transform:translateY(-4px)}.prod-card:hover .prod-name{letter-spacing:.08em}
        .btn-primary:hover{background: ${theme.hover}!important}
        .btn-outline:hover{background: ${theme.accent}!important;color: ${theme.accentText}!important}
        .nav-link:hover{opacity:1!important}
        .swatch:hover{transform:scale(1.15)}
        .opt-btn:hover{border-color: ${theme.accent}!important;color: ${theme.accent}!important}
        .gallery-thumb:hover{opacity:1!important}
        .lb-nav:hover{background:rgba(255,255,255,0.95)!important}
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: ${theme.border}; }
        ::-webkit-scrollbar-thumb { background: ${theme.textMuted}; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: ${theme.textSecondary}; }
       @media (max-width: 768px) {
       
  /* Navigation */
  .nav-links { display: none !important; }
  .menu-btn { display: block !important; }
  
  /* Logo */
  .logo { font-size: 18px !important; letter-spacing: .12em !important; }
  
  /* Hero Section */
  .hero { 
    flex-direction: column !important; 
    padding: 40px 0 !important; 
    min-height: auto !important;
    gap: 30px !important;
  }
  .hero-content { 
    text-align: center !important; 
    max-width: 100% !important;
    padding: 0 16px !important;
  }
  .hero-title { font-size: 32px !important; }
  .hero-desc { 
    margin-left: auto !important; 
    margin-right: auto !important; 
    font-size: 14px !important;
  }
  .hero-cta { padding: 14px 32px !important; }
  
  /* ============= HORIZONTAL SCROLLABLE COLLECTIONS ============= */

/* Container - enables horizontal scroll on mobile */
.collections-scroll-container {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
  padding-bottom: 16px; /* Room for scroll */
  margin: 0 -16px; /* Extend to edges on mobile */
  padding-left: 16px;
  padding-right: 16px;
  cursor: grab;
  scroll-snap-type: x mandatory; /* Smooth snapping */
}

.collections-scroll-container::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

.collections-scroll-container:active {
  cursor: grabbing;
}

/* Wrapper - flex row for horizontal layout */
.collections-scroll-wrapper {
  display: flex;
  gap: 16px;
  min-width: max-content;
  padding-right: 16px; /* Extra space at the end */
}

/* Individual collection cards */
.collection-scroll-card {
  flex: 0 0 auto;
  width: 160px; /* Fixed width for mobile */
  cursor: pointer;
  transition: all 0.3s ease;
  scroll-snap-align: start; /* Snap to start of each card */
  background: var(--surface-alt, #F0EDEA);
  border-radius: 8px;
  overflow: hidden;
}

.collection-scroll-card:active {
  transform: scale(0.97);
}

.collection-scroll-card:last-child {
  margin-right: 16px; /* Extra space after last card */
}

/* Card inner content */
.collection-card-inner {
  padding: 24px 16px;
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.collection-card-number {
  font-family: "'Cormorant Garamond', serif";
  font-size: 12px;
  color: var(--text-muted, #999999);
  display: block;
  margin-bottom: 12px;
  letter-spacing: 0.1em;
}

.collection-card-name {
  font-family: "'Cormorant Garamond', serif";
  font-size: 20px;
  font-weight: 400;
  margin-bottom: 6px;
  color: var(--text, #2C2C2C);
}

.collection-card-tagline {
  font-size: 11px;
  color: var(--text-muted, #999999);
  font-weight: 300;
  letter-spacing: 0.04em;
  line-height: 1.4;
}

.collection-card-arrow {
  position: absolute;
  bottom: 16px;
  right: 16px;
  opacity: 0.5;
  transition: opacity 0.3s, transform 0.3s;
}

.collection-scroll-card:hover .collection-card-arrow {
  opacity: 1;
  transform: translateX(4px);
}

/* Desktop styles - grid layout */
@media (min-width: 769px) {
  .collections-scroll-container {
    overflow: visible;
    margin: 0;
    padding: 0;
    cursor: default;
    scroll-snap-type: none;
  }
  /* 14" laptop screens */
@media (min-width: 1200px) and (max-width: 1440px) {
  .nav-inner { padding: 0 4% !important; }
  .main-container { padding: 0 4% !important; }
  .footer-inner { padding: 60px 4% !important; }
}
/* 15" laptop screens */
@media (min-width: 1441px) and (max-width: 1680px) {
  .nav-inner { padding: 0 5% !important; }
  .main-container { padding: 0 5% !important; }
  .footer-inner { padding: 60px 5% !important; }
}
/* 16"+ large screens */
@media (min-width: 1681px) {
  .nav-inner { padding: 0 6% !important; }
  .main-container { padding: 0 6% !important; }
  .footer-inner { padding: 60px 6% !important; }
  .prod-grid { grid-template-columns: repeat(4, 1fr) !important; }
}
  .collections-scroll-wrapper {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    min-width: auto;
    padding-right: 0;
  }
  
  .collection-scroll-card {
    width: auto;
    scroll-snap-align: none;
  }
  
  .collection-scroll-card:active {
    transform: none;
  }
  
  .collection-scroll-card:last-child {
    margin-right: 0;
  }
}

/* Extra small devices */
@media (max-width: 480px) {
  .collection-scroll-card {
    width: 150px;
  }
  
  .collection-card-inner {
    padding: 20px 14px;
  }
  
  .collection-card-name {
    font-size: 18px;
  }
}

/* Tablet devices - show partial next card */
@media (min-width: 769px) and (max-width: 1024px) {
  .collections-scroll-wrapper {
    grid-template-columns: repeat(2, 1fr);
  }
}
  
  /* Product Grid */
  .prod-grid { 
    grid-template-columns: repeat(2, 1fr) !important; 
    gap: 16px !important;
    padding-bottom: 40px !important;
  }
  .prod-card { margin-bottom: 8px !important; }
  .prod-name { font-size: 16px !important; }
  .prod-price { font-size: 13px !important; }
  .prod-desc { 
    font-size: 11px !important; 
    -webkit-line-clamp: 2 !important;
    display: -webkit-box !important;
    -webkit-box-orient: vertical !important;
    overflow: hidden !important;
  }
  
  /* Product Detail */
  .product-detail { 
    grid-template-columns: 1fr !important; 
    gap: 24px !important;
    padding-bottom: 20px !important;
  }
  .pd-name { font-size: 24px !important; }
  .pd-price { font-size: 18px !important; margin-bottom: 20px !important; }
  .pd-info { padding-top: 0 !important; }
  
  /* Customization Options */
  .opt-btns { gap: 6px !important; }
  .opt-btn { 
    padding: 6px 12px !important; 
    font-size: 11px !important;
  }
  .swatch-row { gap: 8px !important; }
  .swatch { width: 28px !important; height: 28px !important; }
  
  /* Cart Panel */
  .cart-panel { width: 100% !important; max-width: 100% !important; }
  .cart-header { padding: 16px 20px !important; }
  .cart-items { padding: 12px 16px !important; }
  .cart-item { padding: 12px 0 !important; }
  .cart-item-name { font-size: 14px !important; }
  .cart-footer { padding: 16px 20px !important; }
  
  /* Checkout Form */
  .checkout-form { padding: 16px !important; }
  .form-group { margin-bottom: 16px !important; }
  .form-input { padding: 10px 12px !important; font-size: 16px !important; }
  
  /* Ethos Section */
  .ethos-grid { 
    grid-template-columns: 1fr !important; 
    gap: 32px !important;
  }
  .ethos-section { padding: 40px 0 60px !important; }
  .ethos-item { text-align: center !important; }
  
  /* Footer */
  .footer-inner { padding: 40px 20px !important; }
  .footer-links { gap: 20px !important; }
  .footer-logo { font-size: 20px !important; }
  
  /* Shop All Filters */
  .shop-filters { 
    flex-direction: column !important; 
    align-items: flex-start !important;
    gap: 16px !important;
  }
  
  /* Back Button */
  .back-btn { margin-bottom: 16px !important; }
  .cat-header { padding: 24px 0 20px !important; }
  .cat-header-title { font-size: 28px !important; }
  
  /* Gallery Thumbnails */
  .gallery-thumb { width: 56px !important; height: 56px !important; }
  
  /* Lightbox */
  .lb-image { max-width: 95vw !important; max-height: 80vh !important; }
  .lb-nav { width: 32px !important; height: 32px !important; }
  
  /* Main Container */
  .main { padding: 0 16px !important; }
  
  /* Notification */
  .notification { 
    width: 90% !important; 
    text-align: center !important;
    top: 70px !important;
    font-size: 12px !important;
    padding: 8px 16px !important;
  }
  
  /* Theme Toggle */
  .theme-toggle { width: 32px !important; height: 32px !important; }
  
  /* Cart Badge */
  .cart-badge { width: 14px !important; height: 14px !important; font-size: 8px !important; }
  
  /* Add to Cart Button */
  .add-btn { padding: 14px 24px !important; font-size: 12px !important; }
  
  /* Price Display */
  .total-price { font-size: 20px !important; }
}

/* Extra small devices */
@media (max-width: 480px) {
  .prod-grid { 
    grid-template-columns: repeat(2, 1fr) !important; 
    gap: 12px !important;
  }
  
  .hero-title { font-size: 28px !important; }
  .hero-sub { font-size: 10px !important; }
  
  .cat-name { font-size: 18px !important; }
  
  .cart-item { flex-direction: column !important; }
  .remove-btn { align-self: flex-end !important; margin-top: 8px !important; }
  
  .paystack-btn { padding: 14px !important; font-size: 11px !important; }
}
  
      `}</style>

      {notification && <div style={styles.notification} role="alert"><span>{notification}</span></div>}

      {/* LIGHTBOX */}
      {lightbox && (
        <div style={styles.lbOverlay} onClick={() => setLightbox(null)} role="dialog">
          <div style={styles.lbContent} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setLightbox(null)} style={styles.lbClose}><CloseIcon theme={currentTheme} /></button>
            <img src={getImageUrl(lightbox)} alt="Product view" style={styles.lbImage} />
            {getAllImages.length > 1 && (
              <>
                <button className="lb-nav" onClick={() => { const idx = getAllImages.indexOf(lightbox); setLightbox(getAllImages[(idx - 1 + getAllImages.length) % getAllImages.length]); }} style={{ ...styles.lbNav, left: 16 }}><ArrowIcon dir="left" theme={currentTheme} /></button>
                <button className="lb-nav" onClick={() => { const idx = getAllImages.indexOf(lightbox); setLightbox(getAllImages[(idx + 1) % getAllImages.length]); }} style={{ ...styles.lbNav, right: 16 }}><ArrowIcon theme={currentTheme} /></button>
              </>
            )}
            <div style={styles.lbCounter}>{getAllImages.indexOf(lightbox) + 1} / {getAllImages.length}</div>
          </div>
        </div>
      )}

      {/* NAV */}
    <nav style={styles.nav}>
  <div style={styles.navInner} className="nav-inner">
          <button onClick={() => setMobileMenu(!mobileMenu)} style={styles.menuBtn} className="menu-btn"><MenuIcon theme={currentTheme} /></button>
          <div style={styles.logo} onClick={() => navigate("home")} role="button" tabIndex={0}>CASABLNK</div>
          <div style={styles.navLinks} className="nav-links">
            {categories.map((c) => (
              <button key={c.key} className="nav-link" onClick={() => navigate("category", c.key)} style={{ ...styles.navLink, opacity: category === c.key ? 1 : 0.5 }}>{c.label}</button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setDarkMode(!darkMode)} style={styles.themeToggle}>{darkMode ? <SunIcon theme={currentTheme} /> : <MoonIcon theme={currentTheme} />}</button>
            <button onClick={() => { setShowCart(true); setShowCheckout(false); }} style={styles.cartBtn}>
              <CartIcon theme={currentTheme} />
              {cart.length > 0 && <span style={styles.cartBadge}>{cart.length}</span>}
            </button>
          </div>
        </div>
        {mobileMenu && (
          <div style={styles.mobileMenuPanel}>
            {categories.map((c) => <button key={c.key} onClick={() => navigate("category", c.key)} style={styles.mobileMenuItem}>{c.label}</button>)}
          </div>
        )}
      </nav>

    
       <main style={{ ...styles.main, opacity: fadeIn ? 1 : 0, transition: "opacity .3s ease" }} className="main-container">

        {/* HOME */}
        
        {view === "home" && (
          <div className="fade-enter">
           
                    {/* HOME */}
        {view === "home" && (
          <div className="fade-enter">
            
            {/* HERO SECTION - Full screen slider on mobile, two-column on desktop */}
            {window.innerWidth <= 768 ? (
              // ============= MOBILE HERO =============
              <section style={{
                position: "relative", width: "calc(100% + 32px)", minHeight: "90vh",
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", borderRadius: "0", margin: "0 -16px"
              }}>
                {heroImages.map((src, i) => (
                  <div key={`${src}-${i}`} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundImage: `url(${src})`, backgroundSize: "cover", backgroundPosition: "center", opacity: heroSlide === i ? 1 : 0, transition: "opacity 1s ease-in-out", zIndex: 1 }} />
                ))}
                <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0, 0, 0, 0.4)", zIndex: 2 }} />
                <div style={{ position: "relative", zIndex: 3, textAlign: "center", padding: "0 24px", maxWidth: "100%", color: "#FFFFFF" }}>
                  <p style={{ fontSize: "12px", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "16px", fontWeight: "400", opacity: 0.9 }}>BESPOKE FURNITURE</p>
                  <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "42px", fontWeight: "300", lineHeight: "1.1", marginBottom: "16px", textTransform: "uppercase" }}>Designed for<br />the way you live</h1>
          
                  <button style={{ background: "#FFFFFF", color: "#2C2C2C", border: "none", padding: "14px 40px", fontSize: "12px", letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Karla', sans-serif", fontWeight: "500" }}
                    onClick={() => { setShopFilter("all"); window.scrollTo({ top: window.innerHeight - 100, behavior: 'smooth' }); }}>
                    EXPLORE COLLECTION
                  </button>
                </div>
                <div style={{ position: "absolute", bottom: "32px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "12px", zIndex: 3 }}>
                  {heroImages.map((_, i) => (
                    <button key={i} onClick={() => setHeroSlide(i)} style={{ width: heroSlide === i ? "32px" : "8px", height: "3px", borderRadius: "2px", border: "none", background: heroSlide === i ? "#FFFFFF" : "rgba(255,255,255,0.4)", cursor: "pointer", padding: 0 }} />
                  ))}
                </div>
              </section>
            ) : (
              // ============= DESKTOP HERO =============
              <section style={styles.hero}>
                <div style={styles.heroContent}>
                  <p style={styles.heroSub}>Bespoke Furniture</p>
                  <h1 style={styles.heroTitle}>Designed for<br />the way you live</h1>
  
                  <button className="btn-primary hero-cta" style={styles.heroCta} onClick={() => { setShopFilter("all"); window.scrollTo({ top: window.innerHeight - 100, behavior: 'smooth' }); }}>
                    Explore Collection
                  </button>
                </div>
                <div style={{ position: "relative", width: "clamp(280px, 40vw, 500px)", height: "clamp(280px, 40vw, 500px)", flexShrink: 1, overflow: "hidden", borderRadius: 8 }}>
                  {heroImages.map((src, i) => (
                    <img key={`${src}-${i}`} src={src} alt={`CASABLNK collection ${i+1}`} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", opacity: heroSlide === i ? 1 : 0, transition: "opacity 1s ease-in-out" }} />
                  ))}
                  <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8, zIndex: 2 }}>
                    {heroImages.map((_, i) => (
                      <button key={i} onClick={() => setHeroSlide(i)} style={{ width: heroSlide === i ? 24 : 8, height: 8, borderRadius: 4, border: "none", background: heroSlide === i ? theme.accent : `${theme.text}4D`, cursor: "pointer", transition: "all 0.4s ease", padding: 0 }} />
                    ))}
                  </div>
                </div>
              </section>
            )}
            
            {/* Collections */}
            <section style={styles.catSection}>
              <h2 style={styles.sectionTitle}>Collections</h2>
              <div style={styles.catGrid} className="cat-grid">
                {categories.map((c, i) => (
                  <div key={c.key} onClick={() => navigate("category", c.key)} style={{ ...styles.catCard, animationDelay: `${i * 0.1}s` }} role="button" tabIndex={0}>
                    <div style={styles.catCardInner}>
                    
                      <h3 style={styles.catName}>{c.label}</h3>
                      
                      
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Shop All */}
            <section style={{ padding: "80px 0", borderTop: `1px solid ${theme.border}` }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 32, marginBottom: 48, flexWrap: "wrap" }}>
                <h2 style={{ ...styles.sectionTitle, marginBottom: 0 }}>Shop All</h2>
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                  {[{ key: "all", label: "All" }, ...categories].map((tab) => (
                    <button key={tab.key} onClick={() => setShopFilter(tab.key)} style={{ background: "none", border: "none", fontFamily: "'Karla', sans-serif", fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer", color: theme.text, padding: "4px 0", borderBottom: shopFilter === tab.key ? `2px solid ${theme.accent}` : "2px solid transparent", opacity: shopFilter === tab.key ? 1 : 0.4, transition: "all .2s" }}>{tab.label}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 24 }}>
                {(() => {
                  const allProducts = [];
                  const catsToShow = shopFilter === "all" ? Object.keys(products) : [shopFilter];
                  catsToShow.forEach((catKey) => { if (products[catKey]) products[catKey].forEach((p) => allProducts.push({ ...p, _catKey: catKey })); });
                  return allProducts.map((p, i) => (
                    <div key={p.id || p._id} className="prod-card" onClick={() => navigate("product", p._catKey, p)} style={{ ...styles.prodCard, animationDelay: `${i * 0.06}s`, opacity: 0 }} role="button" tabIndex={0}>
                      <div style={{ overflow: "hidden", marginBottom: 16, position: "relative" }}>
                        <div style={{ width: "100%", aspectRatio: "1/1", background: theme.placeholder, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: 4 }}>
                          <ProductImage src={getImageUrl(p.mainImage || p.img)} alt={p.name} theme={currentTheme} />
                        </div>
                      </div>
                      <div style={{ paddingBottom: 8 }}>
                        <span style={{ fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: theme.textMuted, display: "block", marginBottom: 4 }}>{getCategoryLabel(p._catKey)}</span>
                        <h3 className="prod-name" style={{ ...styles.prodName, fontSize: 18 }}>{p.name}</h3>
                        <p style={styles.prodPrice}>{formatPrice(p.price)}</p>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </section>

            {/* Ethos */}
            <section style={styles.ethosSection}>
              <div style={styles.ethosGrid}>
                {[{n:"01",t:"Made to Order",d:"Nothing prefabricated. Each piece begins only when you say so."},{n:"02",t:"Your Specifications",d:"Material, fabric, colour, size — every detail shaped by you."},{n:"03",t:"Delivered with Care",d:"White-glove delivery across Nigeria. Assembled in your space."}].map(e => (
                  <div key={e.n} style={styles.ethosItem}><span style={styles.ethosNum}>{e.n}</span><h4 style={styles.ethosTitle}>{e.t}</h4><p style={styles.ethosText}>{e.d}</p></div>
                ))}
              </div>
            </section>

          </div>
        )}
            <section style={styles.catSection}>
              <h2 style={styles.sectionTitle}>Collections</h2>
              <div style={styles.catGrid} className="cat-grid">
                {categories.map((c, i) => (
                  <div key={c.key} onClick={() => navigate("category", c.key)} style={{ ...styles.catCard, animationDelay: `${i * 0.1}s` }} role="button" tabIndex={0}>
                    <div style={styles.catCardInner}>
                
                      <h3 style={styles.catName}>{c.label}</h3>
          
                      <div style={styles.catArrow}><ArrowIcon theme={currentTheme} /></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ padding: "80px 0", borderTop: `1px solid ${theme.border}` }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 32, marginBottom: 48, flexWrap: "wrap" }}>
                <h2 style={{ ...styles.sectionTitle, marginBottom: 0 }}>Shop All</h2>
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                  {[{ key: "all", label: "All" }, ...categories].map((tab) => (
                    <button key={tab.key} onClick={() => setShopFilter(tab.key)} style={{ background: "none", border: "none", fontFamily: "'Karla', sans-serif", fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer", color: theme.text, padding: "4px 0", borderBottom: shopFilter === tab.key ? `2px solid ${theme.accent}` : "2px solid transparent", opacity: shopFilter === tab.key ? 1 : 0.4, transition: "all .2s" }}>{tab.label}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 24 }}>
                {(() => {
                  const allProducts = [];
                  const catsToShow = shopFilter === "all" ? Object.keys(products) : [shopFilter];
                  catsToShow.forEach((catKey) => {
                    if (products[catKey]) {
                      products[catKey].forEach((p) => allProducts.push({ ...p, _catKey: catKey }));
                    }
                  });
                  return allProducts.map((p, i) => (
                    <div key={p.id || p._id} className="prod-card" onClick={() => navigate("product", p._catKey, p)} style={{ ...styles.prodCard, animationDelay: `${i * 0.06}s`, opacity: 0 }} role="button" tabIndex={0}>
                      <div style={{ overflow: "hidden", marginBottom: 16, position: "relative" }}>
                        <div style={{ width: "100%", aspectRatio: "1/1", background: theme.placeholder, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: 4 }}>
                         <ProductImage src={getImageUrl(p.mainImage || p.img)} alt={p.name} theme={currentTheme} />
                        </div>
                      </div>
                      <div style={{ paddingBottom: 8 }}>
                        <span style={{ fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: theme.textMuted, display: "block", marginBottom: 4 }}>{getCategoryLabel(p._catKey)}</span>
                        <h3 className="prod-name" style={{ ...styles.prodName, fontSize: 18 }}>{p.name}</h3>
                        <p style={styles.prodPrice}>{formatPrice(p.price)}</p>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </section>

            <section style={styles.ethosSection}>
              <div style={styles.ethosGrid}>
                {[{n:"01",t:"Made to Order",d:"Nothing prefabricated. Each piece begins only when you say so."},{n:"02",t:"Your Specifications",d:"Material, fabric, colour, size — every detail shaped by you."},{n:"03",t:"Delivered with Care",d:"White-glove delivery across Nigeria. Assembled in your space."}].map(e => (
                  <div key={e.n} style={styles.ethosItem}><span style={styles.ethosNum}>{e.n}</span><h4 style={styles.ethosTitle}>{e.t}</h4><p style={styles.ethosText}>{e.d}</p></div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* CATEGORY */}
        {view === "category" && category && products[category] && (
          <div className="fade-enter">
            <div style={styles.catHeader}>
              <button onClick={() => navigate("home")} style={styles.backBtn}><ArrowIcon dir="left" theme={currentTheme} /> <span>Back</span></button>
              <h2 style={styles.catHeaderTitle}>{getCategoryLabel(category)}</h2>
              <p style={styles.catHeaderSub}>{categories.find(c => c.key === category)?.tagline}</p>
            </div>
            <div style={styles.prodGrid}>
              {products[category]?.map((p, i) => (
                <div key={p.id || p._id} className="prod-card" onClick={() => navigate("product", category, p)} style={{ ...styles.prodCard, animationDelay: `${i * 0.12}s` }} role="button" tabIndex={0}>
                  <div style={styles.prodImgWrap}><div style={styles.prodPlaceholder}><ProductImage src={getImageUrl(p.mainImage || p.img)} alt={p.name} theme={currentTheme} /></div></div>
                  <div><h3 className="prod-name" style={styles.prodName}>{p.name}</h3><p style={styles.prodDesc}>{p.shortDesc || p.desc}</p><p style={styles.prodPrice}>{formatPrice(p.price)}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {view === "category" && category && !products[category] && (
          <div style={{ textAlign: "center", padding: "80px 0" }}><h2 style={{ color: theme.text }}>Category not found</h2><button onClick={() => navigate("home")} style={styles.backBtn}>Return to home</button></div>
        )}

        {/* PRODUCT DETAIL */}
        {view === "product" && selectedProduct && (
          <div className="fade-enter">
            <div style={styles.catHeader}>
              <button onClick={() => navigate("category", category)} style={styles.backBtn}><ArrowIcon dir="left" theme={currentTheme} /> <span>Back to {getCategoryLabel(category)}</span></button>
            </div>
            <div style={styles.productDetail} className="product-detail">
              <div style={styles.pdImage}>
                <div style={styles.pdPlaceholder} onClick={() => setLightbox(getDisplayImage())} role="button" tabIndex={0}>
                  <ProductImage src={getImageUrl(getDisplayImage())} alt={selectedProduct.name} style={{ position: "absolute", top: 0, left: 0, cursor: "zoom-in" }} theme={currentTheme} />
                  <div style={styles.expandHint}><ExpandIcon theme={currentTheme} /></div>
                  <div style={{ ...styles.pdCustomPreview, position: "relative", zIndex: 2 }}>
                    {selectedVariant && <span style={styles.previewTag}>{selectedVariant}</span>}
                    {customization.material && <span style={styles.previewTag}>{customization.material}</span>}
                    {customization.fabric && <span style={styles.previewTag}>{customization.fabric}</span>}
                    {customization.color && <span style={{ ...styles.previewTag, background: customization.color, color: ["#2C2C2C","#3D3530","#1A1A2E","#4A4540","#5C4033"].includes(customization.color) ? "#F5F0EB" : "#2C2C2C" }}>{getColorName(customization.color)}</span>}
                    {customization.size && <span style={styles.previewTag}>{customization.size}</span>}
                  </div>
                  {selectedProduct.gallery?.length > 1 && !selectedVariant && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); setGalleryIndex((p) => (p - 1 + selectedProduct.gallery.length) % selectedProduct.gallery.length); }} style={{ ...styles.imgNav, left: 12 }}><ArrowIcon dir="left" theme={currentTheme} /></button>
                      <button onClick={(e) => { e.stopPropagation(); setGalleryIndex((p) => (p + 1) % selectedProduct.gallery.length); }} style={{ ...styles.imgNav, right: 12 }}><ArrowIcon theme={currentTheme} /></button>
                    </>
                  )}
                </div>

                {selectedProduct.gallery?.length > 1 && (
                  <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                    {selectedProduct.gallery.map((src, i) => (
                      <button key={`thumb-${i}`} className="gallery-thumb" onClick={() => { setGalleryIndex(i); setSelectedVariant(null); }} style={{ width: 72, height: 72, padding: 0, border: !selectedVariant && galleryIndex === i ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`, background: theme.placeholder, cursor: "pointer", overflow: "hidden", outline: "none", opacity: !selectedVariant && galleryIndex === i ? 1 : 0.6, transition: "all 0.3s ease" }}>
                        <img src={src} alt={`View ${i+1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      </button>
                    ))}
                  </div>
                )}

                {selectedProduct.variantImages && (
                  <div style={{ marginTop: selectedProduct.gallery?.length > 1 ? 8 : 12 }}>
                    <span style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: theme.textMuted, display: "block", marginBottom: 8 }}>Colour — {selectedVariant || ""}</span>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {Object.entries(selectedProduct.variantImages).map(([name, path]) => {
                        const pm = selectedProduct.priceModifiers || {};
                        const variantMod = pm.variantModifiers || {};
                        const modifier = variantMod[name] || 0;
                        return (
                          <button key={name} onClick={() => setSelectedVariant(name)} style={{ width: 72, height: 72, padding: 0, border: selectedVariant === name ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`, background: theme.placeholder, cursor: "pointer", overflow: "hidden", outline: "none", opacity: selectedVariant === name ? 1 : 0.6, transition: "all 0.3s ease", position: "relative" }}>
                            <img src={path} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                            {modifier !== 0 && <span style={{ position: "absolute", bottom: 4, right: 4, background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: 9, padding: "2px 4px", borderRadius: 3, fontWeight: "bold" }}>{modifier > 0 ? `+${formatPrice(modifier)}` : formatPrice(modifier)}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div style={styles.pdInfo}>
                <h2 style={styles.pdName}>{selectedProduct.name}</h2>
                <p style={styles.pdDesc}>{selectedProduct.shortDesc || selectedProduct.desc}</p>
                
                <div style={styles.customSection}>
                  <h4 style={styles.customLabel}>Customize</h4>
                  <div style={styles.divider} />
                  
                  <div style={{ background: theme.surfaceAlt, padding: "12px 16px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 300, color: theme.textSecondary }}>Base Price:</span>
                    <span style={{ fontSize: 16, fontWeight: 500, color: theme.text }}>{formatPrice(selectedProduct.price)}</span>
                  </div>
                  
                  {selectedProduct.materials?.length > 0 && (
                    <div style={styles.optGroup}>
                      <label style={styles.optLabel}>Material</label>
                      <div style={styles.optBtns}>
                        {selectedProduct.materials.map(m => {
                          const pm = selectedProduct.priceModifiers || {};
                          const matMod = pm.materialModifiers || {};
                          const modifier = matMod[m] || 0;
                          const isSelected = customization.material === m;
                          return (
                            <button key={m} className="opt-btn" onClick={() => setCustomization(p => ({ ...p, material: m }))} style={{ ...styles.optBtn, ...(isSelected ? styles.optBtnActive : {}), display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                              <span>{m}</span>
                              {modifier !== 0 && <span style={{ fontSize: 10, color: modifier > 0 ? theme.success : theme.error, fontWeight: 500 }}>{modifier > 0 ? `+${formatPrice(modifier)}` : formatPrice(modifier)}</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {selectedProduct.fabrics?.length > 0 && (
                    <div style={styles.optGroup}>
                      <label style={styles.optLabel}>Upholstery</label>
                      <div style={styles.optBtns}>
                        {selectedProduct.fabrics.map(f => {
                          const pm = selectedProduct.priceModifiers || {};
                          const fabMod = pm.fabricModifiers || {};
                          const modifier = fabMod[f] || 0;
                          const isSelected = customization.fabric === f;
                          return (
                            <button key={f} className="opt-btn" onClick={() => { const nc = { ...customization, fabric: f }; if (selectedProduct.colors?.[f]?.length) nc.color = selectedProduct.colors[f][0]; else delete nc.color; setCustomization(nc); }} style={{ ...styles.optBtn, ...(isSelected ? styles.optBtnActive : {}), display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                              <span>{f}</span>
                              {modifier !== 0 && <span style={{ fontSize: 10, color: modifier > 0 ? theme.success : theme.error, fontWeight: 500 }}>{modifier > 0 ? `+${formatPrice(modifier)}` : formatPrice(modifier)}</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {selectedProduct.sizes?.length > 0 && (
                    <div style={styles.optGroup}>
                      <label style={styles.optLabel}>Size</label>
                      <div style={styles.optBtns}>
                        {selectedProduct.sizes.map(s => {
                          const pm = selectedProduct.priceModifiers || {};
                          const sizeMod = pm.sizeModifiers || {};
                          const modifier = sizeMod[s] || 0;
                          const isSelected = customization.size === s;
                          return (
                            <button key={s} className="opt-btn" onClick={() => setCustomization(p => ({ ...p, size: s }))} style={{ ...styles.optBtn, ...(isSelected ? styles.optBtnActive : {}), display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                              <span>{s}</span>
                              {modifier !== 0 && <span style={{ fontSize: 10, color: modifier > 0 ? theme.success : theme.error, fontWeight: 500 }}>{modifier > 0 ? `+${formatPrice(modifier)}` : formatPrice(modifier)}</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {customization.fabric && selectedProduct.colors?.[customization.fabric]?.length > 0 && (
                    <div style={styles.optGroup}>
                      <label style={styles.optLabel}>Colour — <span style={{ fontWeight: 300 }}>{getColorName(customization.color)}</span></label>
                      <div style={styles.swatchRow}>
                        {selectedProduct.colors[customization.fabric].map(c => (
                          <button key={c} className="swatch" onClick={() => setCustomization(p => ({ ...p, color: c }))} style={{ ...styles.swatch, background: c, outline: customization.color === c ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`, outlineOffset: customization.color === c ? "3px" : "0" }} />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div style={styles.optGroup}>
                    <label style={styles.optLabel}>Special Requests</label>
                    <textarea placeholder="Specific dimensions, additional details, or modifications..." value={customization.notes || ""} onChange={(e) => setCustomization(p => ({ ...p, notes: e.target.value }))} style={styles.textarea} />
                  </div>
                </div>

                <div style={{ marginTop: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, padding: "12px 0", borderTop: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}` }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: theme.text }}>Total Price:</span>
                    <span style={{ fontSize: 24, fontWeight: 600, color: theme.accent }}>{priceLoading ? '...' : formatPrice(dynamicPrice)}</span>
                  </div>
                  {dynamicPrice !== selectedProduct.price && !priceLoading && (
                    <div style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 16, textAlign: "right" }}>
                      (Base: {formatPrice(selectedProduct.price)} {dynamicPrice > selectedProduct.price ? `+${formatPrice(dynamicPrice - selectedProduct.price)}` : ` ${formatPrice(dynamicPrice - selectedProduct.price)}`})
                    </div>
                  )}
                  <button className="btn-primary" onClick={addToCart} style={styles.addBtn} disabled={priceLoading}>Add to Bag — {priceLoading ? '...' : formatPrice(dynamicPrice)}</button>
                </div>
              </div>
            </div>

            {selectedProduct.details && (
              <div style={{ borderTop: `1px solid ${theme.border}`, marginTop: 20, paddingTop: 48, paddingBottom: 60, display: "flex", flexDirection: "column", gap: 40, maxWidth: 600 }}>
                <div><h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 300, marginBottom: 16, letterSpacing: ".04em", color: theme.text }}>About this piece</h3><p style={{ fontSize: 14, lineHeight: 1.8, color: theme.textSecondary, fontWeight: 300 }}>{selectedProduct.details.description}</p></div>
                <div><h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 300, marginBottom: 16, letterSpacing: ".04em", color: theme.text }}>Details</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {[["Dimensions","dimensions"],["Weight","weight"],["Lead Time","leadTime"],["Care","care"]].map(([label, key]) => selectedProduct.details[key] && (
                      <div key={key}><span style={{ fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: theme.textMuted, display: "block", marginBottom: 4 }}>{label}</span><span style={{ fontSize: 13, color: theme.textSecondary, fontWeight: 300, lineHeight: 1.6 }}>{selectedProduct.details[key]}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* CART */}
      {showCart && (
        <div style={styles.overlay} onClick={() => setShowCart(false)}>
          <div style={styles.cartPanel} onClick={e => e.stopPropagation()}>
            <div style={styles.cartHeader}><h3 style={styles.cartTitle}>{showCheckout ? "Checkout" : "Your Bag"}</h3><button onClick={() => setShowCart(false)} style={styles.closeBtn}><CloseIcon theme={currentTheme} /></button></div>
            {!showCheckout ? (
              cart.length === 0 ? (
                <div style={styles.cartEmpty}><p style={styles.cartEmptyText}>Your bag is empty</p><button className="btn-outline" onClick={() => { setShowCart(false); navigate("home"); }} style={styles.cartEmptyBtn}>Browse Collection</button></div>
              ) : (
                <>
                  <div style={styles.cartItems}>
                    {cart.map(item => {
                      const hasPriceAdjustment = item.price !== item.originalPrice;
                      return (
                        <div key={item.cartId} style={styles.cartItem}>
                          <div style={{ display: "flex", gap: 12, flex: 1 }}>
                           {(item.mainImage || item.img) && <img src={getImageUrl(item.mainImage || item.img)} alt={item.name} style={{ width: 56, height: 56, objectFit: "cover", background: theme.placeholder, flexShrink: 0, borderRadius: 4 }} />}
                            <div>
                              <h4 style={styles.cartItemName}>{item.name}</h4>
                              <div style={styles.cartItemSpecs}>
                                {item.customization.variant && <span>{item.customization.variant}</span>}
                                {item.customization.material && <span> · {item.customization.material}</span>}
                                {item.customization.fabric && <span> · {item.customization.fabric}</span>}
                                {item.customization.colorName && <span> · {item.customization.colorName}</span>}
                                {item.customization.size && <span> · {item.customization.size}</span>}
                              </div>
                              {item.customization.notes && <p style={styles.cartItemNotes}>Note: {item.customization.notes}</p>}
                              <div style={{ marginTop: 6 }}>
                                {hasPriceAdjustment && <span style={{ fontSize: 11, color: theme.textMuted, textDecoration: "line-through", marginRight: 8 }}>{formatPrice(item.originalPrice)}</span>}
                                <p style={{ ...styles.cartItemPrice, display: "inline-block", fontWeight: hasPriceAdjustment ? 600 : 400 }}>{formatPrice(item.price)}</p>
                              </div>
                            </div>
                          </div>
                          <button onClick={() => removeFromCart(item.cartId)} style={styles.removeBtn}><CloseIcon theme={currentTheme} /></button>
                        </div>
                      );
                    })}
                  </div>
                  <div style={styles.cartFooter}>
  <div style={{ marginBottom: 12 }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: theme.textSecondary, marginBottom: 4 }}>
      <span>Subtotal</span>
      <span>{formatPrice(cartSubtotal)}</span>
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: theme.textSecondary, marginBottom: 8 }}>
      <span>VAT (7.5%)</span>
      <span>{formatPrice(cartVAT)}</span>
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 500, borderTop: `1px solid ${theme.border}`, paddingTop: 8, color: theme.text }}>
      <span>Total</span>
      <span>{formatPrice(cartTotal)}</span>
    </div>
  </div>
  <button className="btn-primary" onClick={() => setShowCheckout(true)} style={styles.checkoutBtn}>Continue to Checkout</button>
</div>
                </>
              )
            ) : (
              <div style={styles.checkoutForm}>
                <div style={styles.formGroup}><label style={styles.formLabel}>Full Name</label><input id="checkout-name" style={styles.formInput} type="text" placeholder="Your name" /></div>
                <div style={styles.formGroup}><label style={styles.formLabel}>Email</label><input id="checkout-email" style={styles.formInput} type="email" placeholder="you@email.com" /></div>
                <div style={styles.formGroup}><label style={styles.formLabel}>Phone</label><input id="checkout-phone" style={styles.formInput} type="tel" placeholder="+234" /></div>
                <div style={styles.formGroup}><label style={styles.formLabel}>Delivery Address</label><textarea id="checkout-address" style={{ ...styles.formInput, minHeight: 80, resize: "vertical" }} placeholder="Full delivery address" /></div>
                <div style={styles.orderSummary}>
                  <h4 style={styles.summaryTitle}>Order Summary</h4>
                  {cart.map(item => {
                    const hasPriceAdjustment = item.price !== item.originalPrice;
                    return (
                      <div key={item.cartId} style={styles.summaryItem}>
                        <span>{item.name} {item.customization.size && `(${item.customization.size})`}</span>
                        <div>{hasPriceAdjustment && <span style={{ fontSize: 10, color: theme.textMuted, textDecoration: "line-through", marginRight: 6 }}>{formatPrice(item.originalPrice)}</span>}<span>{formatPrice(item.price)}</span></div>
                      </div>
                    );
                  })}
                  <div style={{ ...styles.summaryItem, ...styles.summaryTotal }}><span>Total</span><span>{formatPrice(cartTotal)}</span></div>
                </div>
                <button className="btn-primary" onClick={handlePaystack} style={styles.paystackBtn}><span>Pay with Paystack</span><span style={styles.paystackBadge}>Secured</span></button>
                <button className="btn-outline" onClick={() => setShowCheckout(false)} style={styles.backToCartBtn}>← Back to Bag</button>
              </div>
            )}
          </div>
        </div>
      )}

      {view === "home" && (
        <footer style={styles.footer}>
<div style={styles.footerInner} className="footer-inner">            <div style={styles.footerLogo}>CASABLNK</div>
            <div style={styles.footerLinks}>
              <a href="https://instagram.com/casa_blnk" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>Instagram</a>
              <a href="mailto:hello@casablnk.com" style={styles.footerLink}>hello@casablnk.com</a>
            </div>
            <p style={styles.footerCopy}>© 2026 CASABLNK. All pieces made with intent.</p>
          </div>
        </footer>
      )}
    </div>
  );
}