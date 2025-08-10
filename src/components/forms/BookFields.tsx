import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CategoryFieldsProps } from "@/types/types";

export const BookFields = ({ formData, onFieldChange }: CategoryFieldsProps) => {
    return (
        <>
            {/* Author Field */}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="author" className="text-left">Director</Label>
                <Input
                    id="author"
                    name="author"
                    autoComplete="off"
                    value={formData.author || ''}
                    onChange={(e) => onFieldChange('author', e.target.value)}
                    className="col-span-3"
                />
            </div>
            {/* Release Year Field */}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="releaseYear" className="text-left">Release Year</Label>
                <Input
                    id="releaseYear"
                    name="releaseYear"
                    type="number"
                    autoComplete="off"
                    value={formData.release_year || ''}
                    onChange={(e) => onFieldChange('release_year', e.target.value)}
                    className="col-span-3"
                    min="1000"
                    max="9999"
                />
            </div>
            {/* Series Name Field */}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="series-name" className="text-left">Series Name</Label>
                <Input
                    id="series-name"
                    name="series-name"
                    autoComplete="off"
                    value={formData.series_name || ''}
                    onChange={(e) => onFieldChange('series_name', e.target.value)}
                    className="col-span-3"
                />
            </div>
        </>
    );
};