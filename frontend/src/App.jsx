import { useEffect, useState } from "react";
import useSocket from "./hooks/useSocket";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import Header from "./components/Common/Header";
import Notification from "./components/Common/Notification";
import Menu from "./components/Customer/Menu";
import Cart from "./components/Customer/Cart";
import OrderForm from "./components/Customer/OrderForm";
import OrderTracking from "./components/Customer/OrderTracking";
import OrderHistory from "./components/Customer/OrderHistory";
import AdminLogin from "./components/Admin/AdminLogin";
import AdminDashboard from "./components/Admin/AdminDashboard";


const App = () => {
  const { socket, connected } = useSocket()
  console.log(socket);
  const [cart, setCart] = useState([]);
  const [notification, setNotification] = useState(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  // Load cart from Local Storage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    console.log(JSON.parse(savedCart));
    if (savedCart) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCart(JSON.parse(savedCart))
    }

    // Check Admin Login status
    const adminStatus = localStorage.getItem('isAdmin');
    if (adminStatus === 'true') {
      setIsAdminLoggedIn(true)
    }

  }, [])

  // save cart to LS when changed
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Show notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  // Cart Function
  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem => cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem))
      showNotification(`Added another ${item.name} to cart`, 'success');
    }
    else {
      setCart([...cart, { ...item, quantity: 1 }])
      showNotification(`${item.name} added to cart`, 'success');
    }
  }

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart(cart.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ));
  };


  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
    showNotification('Item removed from cart', 'info');
  };

  const clearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      setCart([]);
      showNotification('Cart cleared', 'info');
    }
  };

  // Admin functions
  const handleAdminLogin = () => {
    setIsAdminLoggedIn(true);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('isAdmin');
    sessionStorage.removeItem('adminPassword');
    setIsAdminLoggedIn(false);
    showNotification('Logged out successfully', 'success');
  };



  return (
    <BrowserRouter>
      <div className="min-h-screen text-slate-800">
        {/* Notification */}
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}


        <Routes>
          <Route
            path="/"
            element={
              <>
                <Header cartCount={cart.length} connected={connected} />
                <Menu onAddToCart={addToCart} />
              </>
            }
          />

          <Route
            path="/cart"
            element={
              <>
                <Header cartCount={cart.length} connected={connected} />
                <Cart
                  cart={cart}
                  onUpdateQuantity={updateQuantity}
                  onRemoveItem={removeFromCart}
                  onClearCart={clearCart}
                />
              </>
            }
          />

          <Route
            path="/checkout"
            element={
              <>
                <Header cartCount={cart.length} connected={connected} />
                <OrderForm
                  cart={cart}
                  socket={socket}
                  onShowNotification={showNotification}
                />
              </>
            }
          />


          <Route
            path="/track/:orderId"
            element={
              <>
                <Header cartCount={cart.length} connected={connected} />
                <OrderTracking
                  socket={socket}
                  onShowNotification={showNotification}
                />
              </>
            }
          />

          <Route
            path="/orders"
            element={
              <>
                <Header cartCount={cart.length} connected={connected} />
                <OrderHistory
                  socket={socket}
                  onShowNotification={showNotification}
                />
              </>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              isAdminLoggedIn ? (
                <AdminDashboard
                  socket={socket}
                  onShowNotification={showNotification}
                  onLogout={handleAdminLogout}
                />
              ) : (
                <AdminLogin
                  socket={socket}
                  onLoginSuccess={handleAdminLogin}
                  onShowNotification={showNotification}
                />
              )
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

      </div>
    </BrowserRouter>
  );
};

export default App;
