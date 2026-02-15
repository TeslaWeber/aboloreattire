import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Truck, RotateCcw } from "lucide-react";

interface DeliveryReturnsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DeliveryReturnsDialog = ({ open, onOpenChange }: DeliveryReturnsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl luxury-text-gradient">
            Delivery & Returns
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Delivery Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Delivery</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Delivery takes 0-2 days, depending on your location within the nation. 
              We strive to ensure your order reaches you as quickly as possible, 
              with delivery times varying based on the distance from our dispatch center to your address.
            </p>
          </div>

          {/* Return Policy Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Return Policy</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              We offer a 2-day return policy on all goods delivered or collected. 
              If you are not completely satisfied with your purchase, you may initiate a return 
              within two (2) days from the date of delivery or pickup. Please ensure that items 
              are returned in their original condition with all tags attached. For assistance with 
              returns, kindly contact our customer service team.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeliveryReturnsDialog;
