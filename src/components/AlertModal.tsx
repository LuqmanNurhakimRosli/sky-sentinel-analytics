import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Send, X } from "lucide-react";

interface AlertModalProps {
  open: boolean;
  onClose: () => void;
  dangerLevel: number;
  location?: string;
}

export const AlertModal = ({
  open,
  onClose,
  dangerLevel,
  location = "Unknown Location",
}: AlertModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-panel-strong border-status-critical/50 max-w-md">
        <div className="absolute inset-0 bg-status-critical/5 rounded-xl animate-pulse-critical pointer-events-none" />
        
        <DialogHeader className="relative">
          <div className="mx-auto w-16 h-16 bg-status-critical/20 rounded-full flex items-center justify-center mb-4 animate-pulse-critical">
            <AlertTriangle className="w-8 h-8 text-status-critical" />
          </div>
          
          <DialogTitle className="text-center font-display text-2xl status-critical">
            CRITICAL ALERT
          </DialogTitle>
          
          <DialogDescription className="text-center space-y-2">
            <p className="text-foreground">
              Danger level has reached <span className="text-status-critical font-bold">{dangerLevel.toFixed(1)}%</span>
            </p>
            <p className="text-muted-foreground text-sm">
              Location: {location}
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Warning Message */}
          <div className="p-4 rounded-lg bg-status-critical/10 border border-status-critical/30">
            <p className="text-sm text-status-critical font-mono">
              ⚠️ Environmental conditions are hazardous. UAV/Drone operations NOT recommended. 
              Outdoor activities should be suspended.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-border hover:border-primary"
              onClick={onClose}
            >
              <X className="w-4 h-4 mr-2" />
              Dismiss
            </Button>
            
            <Button
              className="flex-1 bg-status-critical hover:bg-status-critical/90 text-white"
              onClick={() => {
                // Mock Telegram integration
                alert("Telegram alert would be sent here!");
                onClose();
              }}
            >
              <Send className="w-4 h-4 mr-2" />
              Send Alert
            </Button>
          </div>
          
          <p className="text-[10px] text-center text-muted-foreground font-mono uppercase tracking-wider">
            Future: Telegram Bot Integration
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
