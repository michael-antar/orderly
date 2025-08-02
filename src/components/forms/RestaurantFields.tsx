import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { type PriceRange } from "@/types/types";

type RestaurantFieldsProps = {
    priceRange: PriceRange | '';
    setPriceRange: (price: PriceRange) => void;
    address: string;
    setAddress: (address: string) => void;
};

const priceOptions: PriceRange[] = ['$', '$$', '$$$', '$$$$'];

export const RestaurantFields = ({ priceRange, setPriceRange, address, setAddress }: RestaurantFieldsProps) => {
    return (
        <>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="priceRange" className="text-left">
                    Price Range
                </Label>
                <Select value={priceRange} onValueChange={(value) => setPriceRange(value as PriceRange)}>
                <SelectTrigger id="priceRange" className="col-span-3">
                    <SelectValue placeholder="Select a price range" />
                </SelectTrigger>
                <SelectContent>
                    {priceOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                        {option}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-left">
                    Address
                </Label>
                <Input
                    id="address"
                    name="address"
                    autoComplete="off"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="col-span-3"
                    placeholder="e.g., 123 Main St, Anytown"
                />
            </div>
        </>
    );
};
