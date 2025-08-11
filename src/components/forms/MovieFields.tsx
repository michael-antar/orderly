import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CategoryFieldsProps } from '@/types/types';

export const MovieFields = ({
    formData,
    onFieldChange,
}: CategoryFieldsProps) => {
    return (
        <>
            {/* Director Field */}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="director" className="text-left">
                    Director
                </Label>
                <Input
                    id="director"
                    name="director"
                    autoComplete="off"
                    value={formData.director || ''}
                    onChange={(e) => onFieldChange('director', e.target.value)}
                    className="col-span-3"
                />
            </div>
            {/* Release Year Field */}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="releaseYear" className="text-left">
                    Release Year
                </Label>
                <Input
                    id="releaseYear"
                    name="releaseYear"
                    type="number"
                    autoComplete="off"
                    value={formData.release_year || ''}
                    onChange={(e) => {
                        const value = e.target.value;
                        onFieldChange(
                            'release_year',
                            value === '' ? null : parseInt(value, 10),
                        );
                    }}
                    className="col-span-3"
                    min="1000"
                    max="9999"
                />
            </div>
        </>
    );
};
