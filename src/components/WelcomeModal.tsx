import { useState } from "react";
import { Radio, Zap, Award, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TestType, testTypes, testConfig } from "@/types/navigation";

interface WelcomeModalProps {
  open: boolean;
  onComplete: (selectedLicense: TestType) => void;
  onSkip: () => void;
}

const licenseIcons: Record<TestType, React.ElementType> = {
  technician: Radio,
  general: Zap,
  extra: Award,
};

const licenseDescriptions: Record<TestType, string> = {
  technician: "Perfect for beginners. Start your ham radio journey here!",
  general: "Expanded HF privileges for experienced operators.",
  extra: "Full amateur privileges. The ultimate license.",
};

export function WelcomeModal({ open, onComplete, onSkip }: WelcomeModalProps) {
  const [selectedLicense, setSelectedLicense] = useState<TestType>("technician");

  const handleContinue = () => {
    onComplete(selectedLicense);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-lg"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl">Welcome to Open Ham Prep!</DialogTitle>
          <DialogDescription className="text-base">
            Let's get you set up. Which license are you studying for?
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {testTypes.map((test) => {
            const Icon = licenseIcons[test.id];
            const config = testConfig[test.id];
            const isSelected = selectedLicense === test.id;

            return (
              <button
                key={test.id}
                onClick={() => test.available && setSelectedLicense(test.id)}
                disabled={!test.available}
                className={cn(
                  "relative flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/50 hover:bg-secondary/50",
                  !test.available && "opacity-50 cursor-not-allowed"
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">
                    {test.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {licenseDescriptions[test.id]}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{config.questionCount} questions</span>
                    <span>{config.passingScore} to pass</span>
                  </div>
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={onSkip}
            className="text-muted-foreground"
          >
            Skip tour
          </Button>
          <Button onClick={handleContinue} className="gap-2">
            Continue
            <Sparkles className="w-4 h-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
