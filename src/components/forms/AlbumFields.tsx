import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type CategoryFieldsProps } from "@/types/types";

export const AlbumFields = ({ formData, onFieldChange }: CategoryFieldsProps) => {
    return (
        <>
            {/* Artist Field */}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="artist" className="text-left">Artist</Label>
                <Input
                    id="artist"
                    name="artist"
                    autoComplete="off"
                    value={formData.artist || ''}
                    onChange={(e) => onFieldChange('artist', e.target.value)}
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
        </>
    );
};