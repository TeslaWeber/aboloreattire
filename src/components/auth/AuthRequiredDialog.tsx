import { useNavigate, useLocation } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";

interface AuthRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthRequiredDialog = ({ open, onOpenChange }: AuthRequiredDialogProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignIn = () => {
    onOpenChange(false);
    navigate(`/auth?redirect=${encodeURIComponent(location.pathname)}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Sign In Required</DialogTitle>
          <DialogDescription>
            Please sign in or create an account to add items to your cart and enjoy the full shopping experience.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button
            onClick={handleSignIn}
            className="luxury-gradient text-primary-foreground font-semibold"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Sign In
          </Button>
          <Button
            variant="outline"
            onClick={handleSignIn}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Create Account
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthRequiredDialog;
