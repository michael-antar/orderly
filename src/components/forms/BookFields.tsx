import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type BookFieldsProps = {
    author: string;
    setAuthor: (author: string) => void;
    releaseYear: string;
    setReleaseYear: (releaseYear: string) => void;
    seriesName: string;
    setSeriesName: (seriesName: string) => void;
};

export const BookFields = ({ author, setAuthor, releaseYear, setReleaseYear, seriesName, setSeriesName }: BookFieldsProps) => {
    return (
        <>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="author" className="text-left">Director</Label>
                <Input
                    id="author"
                    name="author"
                    autoComplete="off"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
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
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="series-name" className="text-left">Series Name</Label>
                <Input
                    id="series-name"
                    name="series-name"
                    autoComplete="off"
                    value={seriesName}
                    onChange={(e) => setSeriesName(e.target.value)}
                    className="col-span-3"
                />
            </div>
        </>
    );
};