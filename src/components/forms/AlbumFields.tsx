import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type AlbumFieldsProps = {
    artist: string;
    setArtist: (artist: string) => void;
    releaseYear: string;
    setReleaseYear: (releaseYear: string) => void;
};

export const AlbumFields = ({ artist, setArtist, releaseYear, setReleaseYear }: AlbumFieldsProps) => {
    return (
        <>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="artist" className="text-left">Artist</Label>
                <Input
                    id="artist"
                    name="artist"
                    autoComplete="off"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
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