import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type MovieFieldsProps = {
    director: string;
    setDirector: (director: string) => void;
    releaseYear: string;
    setReleaseYear: (releaseYear: string) => void;
};

export const MovieFields = ({ director, setDirector, releaseYear, setReleaseYear }: MovieFieldsProps) => {
    return (
        <>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="director" className="text-left">Director</Label>
                <Input
                    id="director"
                    name="director"
                    autoComplete="off"
                    value={director}
                    onChange={(e) => setDirector(e.target.value)}
                    className="col-span-3"
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="releaseYear" className="text-left">Release Year</Label>
                <Input
                    id="releaseYear"
                    name="releaseYear"
                    type="number"
                    autoComplete="off"
                    value={releaseYear}
                    onChange={(e) => setReleaseYear(e.target.value)}
                    className="col-span-3"
                    min="1000"
                    max="9999"
                />
            </div>
        </>
    );
};