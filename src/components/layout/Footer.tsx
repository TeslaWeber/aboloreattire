import { useState } from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import DeliveryReturnsDialog from "@/components/DeliveryReturnsDialog";
import { useAuth } from "@/context/AuthContext";

const Footer = () => {
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const { user } = useAuth();

  return (
    <footer className="bg-card border-t border-border">
      {/* Sign Up/Sign In Section - Only show when not logged in */}
      {!user && (
        <div className="border-b border-border">
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-2xl mx-auto text-center">
              <h3 className="font-display text-2xl lg:text-3xl font-bold mb-3">
                Welcome to <span className="luxury-text-gradient">ABOLORE COUTURE</span>
              </h3>
              <p className="text-muted-foreground mb-6">
                Sign in to access exclusive offers, track your orders, and enjoy a personalized shopping experience.
              </p>
              <div className="flex gap-3 justify-center">
                <Button asChild variant="outline">
                  <Link to="/auth?mode=signin">Sign In</Link>
                </Button>
                <Button asChild className="luxury-gradient text-primary-foreground font-semibold">
                  <Link to="/auth?mode=signup">Create Account</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div>
            <h4 className="font-display text-xl font-bold luxury-text-gradient mb-4">
              ABOLORE COUTURE
            </h4>
            <p className="text-muted-foreground text-sm mb-4">
              Discover luxury fashion, accessories, and beauty products curated for the modern connoisseur.
            </p>
            <div className="flex gap-4">
              <a href="https://www.facebook.com/share/16t27kaxMC/?mibextid=qi2Omg" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="https://www.instagram.com/abolorecouture.lovable?igsh=MXc2YXE2N3NtejlhaQ==" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Customer Service */}
          <div>
            <h5 className="font-semibold text-foreground mb-4">Customer Service</h5>
            <ul className="space-y-3">
              <li>
                <a href="http://wa.me/+2348069535463" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <button 
                  onClick={() => setDeliveryDialogOpen(true)}
                  className="text-muted-foreground hover:text-primary text-sm transition-colors text-left"
                >
                  Delivery & Returns
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h5 className="font-semibold text-foreground mb-4">Contact</h5>
            <ul className="space-y-3">
              <li>
                <a href="tel:+2348022050740" className="flex items-center gap-3 text-muted-foreground text-sm hover:text-primary transition-colors">
                  <Phone className="h-4 w-4 text-primary" />
                  +2348022050740
                </a>
              </li>
              <li>
                <a 
                  href="mailto:abolorecouture@gmail.com" 
                  className="flex items-center gap-3 text-muted-foreground text-sm hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4 text-primary" />
                  abolorecouture@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3 text-muted-foreground text-sm">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <span>Ibadan, Nigeria</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-6">
              <Link to="/privacy" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                Terms of Service
              </Link>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <p>© 2026 — Developed by TeslaWeber Incorporations</p>
              <a
                href="https://wa.me/2348064051248"
                target="_blank"
                rel="noopener noreferrer"
                className="text-success hover:text-success/80 transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <DeliveryReturnsDialog open={deliveryDialogOpen} onOpenChange={setDeliveryDialogOpen} />
    </footer>
  );
};

export default Footer;