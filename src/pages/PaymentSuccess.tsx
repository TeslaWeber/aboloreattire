import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const reference = searchParams.get("reference") || searchParams.get("trxref");

  useEffect(() => {
    if (reference) {
      clearCart();
      setStatus("success");
    } else {
      setStatus("error");
    }
  }, [reference]);

  if (status === "loading") {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Verifying your payment...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <XCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
        <h1 className="font-display text-3xl font-bold mb-2">Payment Issue</h1>
        <p className="text-muted-foreground mb-6">We couldn't verify your payment. Please contact support.</p>
        <Button asChild><Link to="/">Go Home</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
      <h1 className="font-display text-3xl font-bold mb-2">Payment Successful!</h1>
      <p className="text-muted-foreground mb-2">
        Your payment has been received and your order is being processed.
      </p>
      {reference && (
        <p className="text-sm text-muted-foreground mb-6">Reference: {reference}</p>
      )}
      <div className="flex gap-3 justify-center">
        <Button asChild><Link to="/products">Continue Shopping</Link></Button>
        <Button variant="outline" asChild><Link to="/account">View Orders</Link></Button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
