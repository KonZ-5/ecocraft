import { createContext, useContext, useState, useCallback } from "react";
import { cartApi } from "../services/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  const fetchCartCount = useCallback(async () => {
    if (!user || user.role !== "pembeli") {
      setCartCount(0);
      return;
    }
    try {
      const res = await cartApi.get();
      setCartCount(res.data.data?.length || 0);
    } catch {
      setCartCount(0);
    }
  }, [user]);

  return (
    <CartContext.Provider value={{ cartCount, fetchCartCount, setCartCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
