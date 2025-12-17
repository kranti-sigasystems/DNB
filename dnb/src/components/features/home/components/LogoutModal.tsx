import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/* ----------------------------- Types ----------------------------- */

interface LogoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

/* --------------------------- Component --------------------------- */

export default function LogoutDialog({ isOpen, onClose, onLogout }: LogoutDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">Confirm Logout</DialogTitle>
          <DialogDescription className="text-gray-700">
            Are you sure you want to logout? You’ll need to log in again to continue using the app.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex justify-center gap-4 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-6 py-2 rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white cursor-pointer"
          >
            Logout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
