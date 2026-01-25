import { motion } from "motion/react";
import { useAuth } from "../hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShieldX, LogOut } from "lucide-react";

interface BlockedUserScreenProps {
  reason?: string | null;
}

export function BlockedUserScreen({ reason }: BlockedUserScreenProps) {
  const { signOut } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-[400px] border-destructive/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <ShieldX className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription>
              Your account has been blocked from accessing IndieCraft.
            </CardDescription>
          </CardHeader>
          {reason && (
            <CardContent>
              <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                <strong>Reason:</strong> {reason}
              </div>
            </CardContent>
          )}
          <CardFooter className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground text-center">
              If you believe this is a mistake, please contact your team admin.
            </p>
            <Button variant="outline" onClick={signOut} className="mt-2">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
