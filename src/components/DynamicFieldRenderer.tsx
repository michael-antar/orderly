import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type {
    FieldDefinition,
    ItemPropertyValue,
    LocationValue,
} from '@/types/types';

type Props = {
    field: FieldDefinition;
    value: ItemPropertyValue;
    onChange: (value: ItemPropertyValue) => void;
};

export const DynamicFieldRenderer = ({ field, value, onChange }: Props) => {
    const label = field.label || field.key;

    // --- Select (Enum) ---
    if (field.type === 'select' && field.options) {
        const stringValue = value?.toString() || '';
        const isLegacyValue =
            stringValue !== '' && !field.options.includes(stringValue);

        return (
            <div className="space-y-2">
                <Label className="text-sm font-semibold">{label}</Label>
                <Select value={stringValue} onValueChange={onChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                        {/* Render legacy option if it exists */}
                        {isLegacyValue && (
                            <SelectItem value={stringValue}>
                                {stringValue}{' '}
                                <span className="text-muted-foreground text-xs ml-1">
                                    (Legacy)
                                </span>
                            </SelectItem>
                        )}
                        {field.options.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                                {opt}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        );
    }

    // --- Boolean (Switch) ---
    if (field.type === 'boolean') {
        return (
            <div className="flex items-center justify-between rounded-lg border p-4">
                <Label className="text-sm font-semibold">{label}</Label>
                <Switch checked={!!value} onCheckedChange={onChange} />
            </div>
        );
    }

    // --- Number ---
    if (field.type === 'number') {
        const numValue = value === null ? '' : (value as number);

        return (
            <div className="space-y-2">
                <Label className="text-sm font-semibold">{label}</Label>
                <Input
                    type="number"
                    value={numValue}
                    onChange={(e) => {
                        const val = e.target.value;
                        onChange(val === '' ? null : Number(val));
                    }}
                    placeholder="0"
                />
            </div>
        );
    }

    // --- Date ---
    if (field.type === 'date') {
        const dateValue = (value as string) || '';

        return (
            <div className="space-y-2">
                <Label className="text-sm font-semibold">{label}</Label>
                <Input
                    type="date" // Native browser date picker
                    value={dateValue}
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>
        );
    }

    // --- Location ---
    // Only display address, with plans to use coordinate values later in filtering
    if (field.type === 'location') {
        const locValue = (value as LocationValue) || {
            address: '',
            coordinates: null,
        };

        return (
            <div className="space-y-2">
                <Label className="text-sm font-semibold">{label}</Label>
                <Input
                    value={locValue.address}
                    onChange={(e) =>
                        onChange({
                            ...locValue,
                            address: e.target.value,
                            coordinates: locValue.coordinates || null,
                        })
                    }
                    placeholder="Enter address..."
                />
                <p className="text-[0.8rem] text-muted-foreground">
                    Map search coming soon.
                </p>
            </div>
        );
    }

    // --- String (Default) ---
    const strValue = (value as string) || '';

    return (
        <div className="space-y-2">
            <Label className="text-sm font-semibold">{label}</Label>
            <Input
                value={strValue}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
};
