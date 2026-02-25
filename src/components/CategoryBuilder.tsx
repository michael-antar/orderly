import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { IconPicker } from './IconPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

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
    const [fieldToDelete, setFieldToDelete] = useState<number | null>(null);

    const newFieldInputRef = useRef<HTMLInputElement>(null);

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
        setFields([newField, ...fields]);

        // Autofocus
        setTimeout(() => {
            if (newFieldInputRef.current) {
                newFieldInputRef.current.focus();
            }
        }, 50);
    };

    const updateField = useCallback(
        (index: number, updates: Partial<FieldDefinition>) => {
            setFields((prev) => {
                const newFields = [...prev];
                newFields[index] = { ...newFields[index], ...updates };
                return newFields;
            });
        },
        [],
    );

    const requestRemoveField = useCallback(
        (index: number, isLocked: boolean) => {
            if (isLocked) {
                setFieldToDelete(index);
            } else {
                setFields((prev) => prev.filter((_, i) => i !== index));
            }
        },
        [],
    );

    const confirmRemoveField = () => {
        if (fieldToDelete !== null) {
            setFields((prev) => prev.filter((_, i) => i !== fieldToDelete));
            setFieldToDelete(null);
        }
    };

    // Add select-type option (only add if new)
    const addOption = useCallback((index: number, option: string) => {
        if (!option.trim()) return;
        setFields((prev) => {
            const field = prev[index];
            const currentOptions = field.options || [];
            if (!currentOptions.includes(option.trim())) {
                const newFields = [...prev];
                newFields[index] = {
                    ...field,
                    options: [...currentOptions, option.trim()],
                };
                return newFields;
            }
            return prev;
        });
    }, []);

    const removeOption = useCallback(
        (index: number, optionToRemove: string) => {
            setFields((prev) => {
                const field = prev[index];
                const currentOptions = field.options || [];
                const newFields = [...prev];
                newFields[index] = {
                    ...field,
                    options: currentOptions.filter(
                        (opt) => opt !== optionToRemove,
                    ),
                };
                return newFields;
            });
        },
        [],
    );

    const handleSave = async () => {
        if (!user) return;
        if (!name.trim()) return toast.error('Category name is required');

        // Basic Validation
        if (fields.some((f) => !f.label.trim())) {
            return toast.error('All fields must have a label');
        }

        const invalidSelect = fields.find(
            (f) =>
                f.type === 'select' && (!f.options || f.options.length === 0),
        );
        if (invalidSelect) {
            return toast.error(
                `The "${invalidSelect.label}" field must have at least one option.`,
            );
        }

        // Generate keys for new fields
        const finalFields = fields.map((f) => {
            if (!existingFieldKeys.has(f.key)) {
                return { ...f, key: slugify(f.label) };
            }
            return f; // Keep existing keys locked
        });

        // Check for duplicate keys
        const keys = finalFields.map((f) => f.key);
        if (new Set(keys).size !== keys.length) {
            return toast.error('Duplicate field names detected');
        }

        setLoading(true);

        const payload = {
            name: name.trim(),
            icon,
            field_definitions: finalFields, // JSONB column
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
        <div className="flex flex-col h-full bg-background overflow-hidden">
            {/* Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-6">
                {/* Header / Meta Data */}
                <div className="space-y-6 mb-4">
                    <div className="flex flex-col sm:flex-row gap-6 items-start">
                        <div className="space-y-2 flex-1 w-full">
                            <Label htmlFor="category-name">Category Name</Label>
                            <Input
                                id="category-name"
                                name="category-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Board Games"
                            />
                        </div>
                        <div className="space-y-2 w-full sm:w-[200px]">
                            <Label htmlFor="category-icon">Icon</Label>
                            <IconPicker
                                id="category-icon"
                                selectedIcon={icon}
                                onChange={setIcon}
                            />
                        </div>
                    </div>
                </div>

                <div className="border-t my-4" />

                {/* Fields Editor */}
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
                            <p className="text-muted-foreground mb-4">
                                No fields defined yet.
                            </p>
                            <Button variant="outline" onClick={addField}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add your first field
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {fields.map((field, index) => (
                                <FieldEditorRow
                                    key={field.key}
                                    field={field}
                                    index={index}
                                    isLocked={existingFieldKeys.has(field.key)}
                                    isFirst={index === 0}
                                    newFieldInputRef={newFieldInputRef}
                                    onUpdate={updateField}
                                    onRemove={requestRemoveField}
                                    onAddOption={addOption}
                                    onRemoveOption={removeOption}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Deletion Warning Popup */}
            <AlertDialog
                open={fieldToDelete !== null}
                onOpenChange={(isOpen) => {
                    if (!isOpen) setFieldToDelete(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Field?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Warning: Deleting the "
                            <span className="font-semibold text-foreground">
                                {fieldToDelete !== null &&
                                    fields[fieldToDelete]?.label}
                            </span>
                            " field will permanently delete this data from all
                            existing items in this category. Are you sure?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmRemoveField}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete Field
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Footer */}
            <div className="p-4 border-t bg-background flex justify-end gap-3 mt-auto shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <Button variant="outline" onClick={onCancel} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={loading}
                    className="min-w-[120px]"
                >
                    {loading ? 'Saving...' : 'Save Category'}
                </Button>
            </div>
        </div>
    );
};

type FieldEditorRowProps = {
    field: FieldDefinition;
    index: number;
    isLocked: boolean;
    isFirst: boolean;
    newFieldInputRef: React.RefObject<HTMLInputElement | null>;
    onUpdate: (index: number, updates: Partial<FieldDefinition>) => void;
    onRemove: (index: number, isLocked: boolean) => void;
    onAddOption: (index: number, option: string) => void;
    onRemoveOption: (index: number, option: string) => void;
};

const FieldEditorRow = memo(
    ({
        field,
        index,
        isLocked,
        isFirst,
        newFieldInputRef,
        onUpdate,
        onRemove,
        onAddOption,
        onRemoveOption,
    }: FieldEditorRowProps) => {
        return (
            <div className="relative p-4 border rounded-lg bg-card space-y-4 shadow-sm group">
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                    {/* Label Input */}
                    <div className="flex-1 space-y-1.5 w-full">
                        <Label
                            htmlFor={`field-label-${field.key}`}
                            className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                        >
                            Label
                        </Label>
                        <Input
                            id={`field-label-${field.key}`}
                            name={`field-label-${field.key}`}
                            ref={isFirst ? newFieldInputRef : null}
                            value={field.label}
                            onChange={(e) =>
                                onUpdate(index, { label: e.target.value })
                            }
                            placeholder="Field Label"
                            className="bg-background"
                        />
                    </div>

                    {/* Type Select */}
                    <div className="w-full sm:w-[200px] space-y-1.5 shrink-0">
                        <Label
                            htmlFor={`field-type-${field.key}`}
                            className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between"
                        >
                            <span>Type</span>
                        </Label>
                        <Select
                            value={field.type}
                            onValueChange={(val) =>
                                onUpdate(index, { type: val as FieldType })
                            }
                            disabled={isLocked}
                        >
                            <SelectTrigger
                                id={`field-type-${field.key}`}
                                name={`field-type-${field.key}`}
                                className="bg-background"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {FIELD_TYPES.map((t) => (
                                    <SelectItem key={t.value} value={t.value}>
                                        {t.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Delete Button */}
                    <div className="pt-6 shrink-0 hidden sm:block">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onRemove(index, isLocked)}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Dynamic Options for Select Type */}
                {field.type === 'select' && (
                    <div className="pt-2 pl-2 border-l-2 border-primary/20 space-y-3">
                        <Label
                            htmlFor={`field-options-${field.key}`}
                            className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                        >
                            Options
                        </Label>

                        {/* Current Options */}
                        <div className="flex flex-wrap gap-2">
                            {field.options?.map((opt) => (
                                <Badge
                                    key={opt}
                                    variant="secondary"
                                    className="pr-1 py-1"
                                >
                                    {opt}
                                    <button
                                        onClick={() =>
                                            onRemoveOption(index, opt)
                                        }
                                        className="ml-1 hover:text-destructive rounded-full p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>

                        <Input
                            id={`field-options-${field.key}`}
                            name={`field-options-${field.key}`}
                            placeholder="Type option and press Enter..."
                            className="h-9 text-sm max-w-sm bg-background"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    onAddOption(index, e.currentTarget.value);
                                    e.currentTarget.value = '';
                                }
                            }}
                        />
                    </div>
                )}

                {/* Mobile Delete Button */}
                <div className="flex justify-end sm:hidden pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRemove(index, isLocked)}
                        className="text-destructive hover:bg-destructive/10"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Field
                    </Button>
                </div>
            </div>
        );
    },
);
