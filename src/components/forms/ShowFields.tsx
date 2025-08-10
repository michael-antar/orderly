import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CategoryFieldsProps } from "@/types/types";

export const ShowFields = ({ formData, onFieldChange }: CategoryFieldsProps) => {
    return (
        <> 
            {/* Start Year Field */}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startYear" className="text-left">Start Year</Label>
                <Input
                    id="startYear"
                    name="startYear"
                    type="number"
                    autoComplete="off"
                    value={formData.start_year || ''}
                    onChange={(e) => onFieldChange('start_year', e.target.value)}
                    className="col-span-3"
                    min="1000"
                    max="9999"
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="endYear" className="text-left">End Year</Label>
                <Input
                    id="endYear"
                    name="endYear"
                    type="number"
                    autoComplete="off"
                    value={formData.end_year || ''}
                    onChange={(e) => onFieldChange('end_year', e.target.value)}
                    className="col-span-3"
                    min="1000"
                    max="9999"
                />
            </div>
        </>
    );
};