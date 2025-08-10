import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { type CategoryFieldsProps, type PriceRange } from "@/types/types";

const priceOptions: PriceRange[] = ['$', '$$', '$$$', '$$$$'];

export const RestaurantFields = ({ formData, onFieldChange }: CategoryFieldsProps) => {
    return (
        <>
            {/* Price Range Field */}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="priceRange" className="text-left">
                    Price Range
                </Label>
                <Select
                    value={formData.price_range || ''}
                    onValueChange={(e) => onFieldChange('price_range', e)}
                >
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
            {/* Address Field */}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-left">
                    Address
                </Label>
                <Input
                    id="address"
                    name="address"
                    autoComplete="off"
                    value={formData.address || ''}
                    onChange={(e) => onFieldChange('address', e.target.value)}
                    className="col-span-3"
                    placeholder="e.g., 123 Main St, Anytown"
                />
            </div>
        </>
    );
};
