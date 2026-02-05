import { useState, useEffect } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { IconPicker } from './IconPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

import type {
    CategoryDefinition,
    FieldDefinition,
    FieldType,
} from '@/types/types';

// --- Helpers ---
const slugify = (text: string) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_') // Replace spaces with -
        .replace(/[^\w-]+/g, '') // Remove all non-word chars
        .replace(/__+/g, '_'); // Replace multiple - with single -
};

const FIELD_TYPES: { value: FieldType; label: string }[] = [
    { value: 'string', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Yes/No (Switch)' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Select (Dropdown)' },
    { value: 'location', label: 'Location' },
];

type CategoryBuilderProps = {
    categoryId: string | null; // null = Create Mode
    onSave: () => void;
    onCancel: () => void;
};

export const CategoryBuilder = ({
    categoryId,
    onSave,
    onCancel,
}: CategoryBuilderProps) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('default');
    const [fields, setFields] = useState<FieldDefinition[]>([]);

    // Track original field keys to enforce locking
    const [existingFieldKeys, setExistingFieldKeys] = useState<Set<string>>(
        new Set(),
    );

    // --- Load Data (Edit Mode) ---
    useEffect(() => {
        const loadCategory = async () => {
            if (!categoryId) return;
            setLoading(true);

            const { data, error } = await supabase
                .from('category_definitions')
                .select('*')
                .eq('id', categoryId)
                .single();

            if (error) {
                toast.error('Failed to load category');
                onCancel();
            } else if (data) {
                const def = data as unknown as CategoryDefinition;
                setName(def.name);
                setIcon(def.icon);
                setFields(def.field_definitions);

                // Mark these keys as "Locked"
                setExistingFieldKeys(
                    new Set(def.field_definitions.map((f) => f.key)),
                );
            }
            setLoading(false);
        };

        loadCategory();
    }, [categoryId, onCancel]);

    // --- Field Handlers ---

    const addField = () => {
        const newField: FieldDefinition = {
            // Temporary key until user types a label
            key: `field_${Date.now()}`,
            label: '',
            type: 'string',
            required: false,
        };
        setFields([...fields, newField]);
    };

    const updateField = (index: number, updates: Partial<FieldDefinition>) => {
        setFields((prev) => {
            const newFields = [...prev];
            const field = { ...newFields[index], ...updates };

            // Auto-generate Key from Label (ONLY if it's a new field)
            if (
                updates.label !== undefined &&
                !existingFieldKeys.has(field.key)
            ) {
                field.key = slugify(field.label);
            }

            newFields[index] = field;
            return newFields;
        });
    };

    const removeField = (index: number) => {
        const field = fields[index];
        // Warning if deleting an existing field (Data Loss Risk)
        if (existingFieldKeys.has(field.key)) {
            if (
                !confirm(
                    `Warning: Deleting the "${field.label}" field will permanently delete this data from all existing items. Are you sure?`,
                )
            ) {
                return;
            }
        }
        setFields((prev) => prev.filter((_, i) => i !== index));
    };

    // --- Option Handlers (for Select type) ---

    const addOption = (fieldIndex: number, option: string) => {
        if (!option.trim()) return;
        const field = fields[fieldIndex];
        const currentOptions = field.options || [];

        if (!currentOptions.includes(option.trim())) {
            updateField(fieldIndex, {
                options: [...currentOptions, option.trim()],
            });
        }
    };

    const removeOption = (fieldIndex: number, optionToRemove: string) => {
        const field = fields[fieldIndex];
        const currentOptions = field.options || [];
        updateField(fieldIndex, {
            options: currentOptions.filter((opt) => opt !== optionToRemove),
        });
    };

    // --- Save ---

    const handleSave = async () => {
        if (!user) return;
        if (!name.trim()) return toast.error('Category name is required');

        // Basic Validation
        if (fields.some((f) => !f.label.trim() || !f.key.trim())) {
            return toast.error('All fields must have a label');
        }

        // Check for duplicate keys
        const keys = fields.map((f) => f.key);
        if (new Set(keys).size !== keys.length) {
            return toast.error('Duplicate field names detected');
        }

        setLoading(true);

        const payload = {
            name: name.trim(),
            icon,
            field_definitions: fields, // JSONB column
            user_id: user.id,
        };

        let error;

        if (categoryId) {
            // Update
            const { error: updateError } = await supabase
                .from('category_definitions')
                .update(payload)
                .eq('id', categoryId);
            error = updateError;
        } else {
            // Create
            const { error: insertError } = await supabase
                .from('category_definitions')
                .insert(payload);
            error = insertError;
        }

        if (error) {
            toast.error('Failed to save category', {
                description: error.message,
            });
        } else {
            toast.success(categoryId ? 'Category updated' : 'Category created');
            onSave();
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header / Meta Data */}
            <div className="p-6 space-y-4 border-b bg-muted/20">
                <div className="flex gap-4 items-end">
                    <div className="space-y-2 flex-1">
                        <Label>Category Name</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Board Games"
                            className="bg-background"
                        />
                    </div>
                    <div className="space-y-2 w-[200px]">
                        <Label>Icon</Label>
                        <div className="bg-background rounded-md">
                            <IconPicker
                                selectedIcon={icon}
                                onChange={setIcon}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Fields Editor */}
            <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-medium">Fields</h3>
                            <p className="text-sm text-muted-foreground">
                                Define what data to track.
                            </p>
                        </div>
                        <Button
                            size="sm"
                            onClick={addField}
                            variant="secondary"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Field
                        </Button>
                    </div>

                    {fields.length === 0 ? (
                        <div className="text-center py-10 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground">
                                No fields defined yet.
                            </p>
                            <Button variant="link" onClick={addField}>
                                Add your first field
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {fields.map((field, index) => {
                                const isLocked = existingFieldKeys.has(
                                    field.key,
                                );

                                return (
                                    <div
                                        key={index}
                                        className="p-4 border rounded-lg bg-card space-y-4 shadow-sm"
                                    >
                                        <div className="flex gap-4 items-start">
                                            {/* Label Input */}
                                            <div className="flex-1 space-y-1.5">
                                                <Label className="text-xs text-muted-foreground">
                                                    Label
                                                </Label>
                                                <Input
                                                    value={field.label}
                                                    onChange={(e) =>
                                                        updateField(index, {
                                                            label: e.target
                                                                .value,
                                                        })
                                                    }
                                                    placeholder="Field Label"
                                                />
                                            </div>

                                            {/* Type Select */}
                                            <div className="w-[180px] space-y-1.5">
                                                <Label className="text-xs text-muted-foreground">
                                                    Type{' '}
                                                    {isLocked && '(Locked)'}
                                                </Label>
                                                <Select
                                                    value={field.type}
                                                    onValueChange={(val) =>
                                                        updateField(index, {
                                                            type: val as FieldType,
                                                        })
                                                    }
                                                    disabled={isLocked}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {FIELD_TYPES.map(
                                                            (t) => (
                                                                <SelectItem
                                                                    key={
                                                                        t.value
                                                                    }
                                                                    value={
                                                                        t.value
                                                                    }
                                                                >
                                                                    {t.label}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Delete Button */}
                                            <div className="pt-6">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        removeField(index)
                                                    }
                                                    className="text-muted-foreground hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Dynamic Options for Select Type */}
                                        {field.type === 'select' && (
                                            <div className="pl-4 border-l-2 border-muted ml-2 space-y-2">
                                                <Label className="text-xs">
                                                    Options
                                                </Label>
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    {field.options?.map(
                                                        (opt) => (
                                                            <Badge
                                                                key={opt}
                                                                variant="secondary"
                                                                className="pr-1"
                                                            >
                                                                {opt}
                                                                <button
                                                                    onClick={() =>
                                                                        removeOption(
                                                                            index,
                                                                            opt,
                                                                        )
                                                                    }
                                                                    className="ml-1 hover:text-destructive"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </Badge>
                                                        ),
                                                    )}
                                                </div>
                                                <Input
                                                    placeholder="Type option and press Enter..."
                                                    className="h-8 text-sm max-w-sm"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            addOption(
                                                                index,
                                                                e.currentTarget
                                                                    .value,
                                                            );
                                                            e.currentTarget.value =
                                                                '';
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {/* Key Preview (for debugging/transparency) */}
                                        <div className="text-[10px] text-muted-foreground font-mono px-1">
                                            DB Key: {field.key}{' '}
                                            {isLocked && '🔒'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-4 border-t bg-background flex justify-end gap-2">
                <Button variant="outline" onClick={onCancel} disabled={loading}>
                    Cancel
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Category'}
                </Button>
            </div>
        </div>
    );
};
