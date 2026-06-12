import { CartProvider } from "@/lib/cart";
import { Chrome } from "@/components/chrome";

/**
 * Storefront layout: cart state + sticky header/drawer/footer chrome. Applies to
 * every customer-facing page but NOT to the Keystatic admin (which sits outside
 * this route group).
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="app">
      <CartProvider>
        <Chrome>{children}</Chrome>
      </CartProvider>
    </div>
  );
}
