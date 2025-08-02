import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ShowFieldsProps = {
    startYear: string;
    setStartYear: (startYear: string) => void;
    endYear: string;
    setEndYear: (endYear: string) => void;
};

export const ShowFields = ({ startYear, setStartYear, endYear, setEndYear }: ShowFieldsProps) => {
    return (
        <>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startYear" className="text-left">Start Year</Label>
                <Input
                    id="startYear"
                    name="startYear"
                    type="number"
                    autoComplete="off"
                    value={startYear}
                    onChange={(e) => setStartYear(e.target.value)}
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
                    value={endYear}
                    onChange={(e) => setEndYear(e.target.value)}
                    className="col-span-3"
                    min="1000"
                    max="9999"
                />
            </div>
        </>
    );
};