import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from './ui/separator';

type ComparisonModalProps = {
    children: React.ReactNode; // The trigger button will be passed as children
};

export const ComparisonModal = ({ children }: ComparisonModalProps) => {
    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Which is better?</DialogTitle>
                    <DialogDescription>
                        Select the item you prefer. Click an item's name to see
                        more details.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 py-4">
                    {/* Left Item */}
                    <div className="flex flex-col items-center gap-4">
                        <h3 className="text-xl font-semibold text-center h-16 flex items-center">
                            Placeholder Item A
                        </h3>
                        <Button className="w-full">Choose</Button>
                    </div>

                    {/* Right Item */}
                    <div className="flex flex-col items-center gap-4">
                        <h3 className="text-xl font-semibold text-center h-16 flex items-center">
                            Placeholder Item B
                        </h3>
                        <Button className="w-full">Choose</Button>
                    </div>
                </div>

                <Separator />

                <DialogFooter>
                    {/* This will eventually be conditional */}
                    <Button variant="secondary" className="w-full">
                        Next Matchup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
