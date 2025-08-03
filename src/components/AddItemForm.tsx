import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { type Category, type Item, type Status, type PriceRange } from "@/types/types";
import { categoryConfig } from "@/config/categoryConfig";

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Plus } from 'lucide-react';

const parseOptionalInt = (value: string): number | null => {
    if (value.trim() === '') return null;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? null : parsed;
};

type AddItemFormProps = {
    category: Category;
    onSuccess: () => void; // Callback to refresh the list
};
    
export function AddItemForm({ category, onSuccess }: AddItemFormProps) {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<Status>('ranked');

    // Category-specific fields
    const [releaseYear, setReleaseYear] = useState('');
    const [director, setDirector] = useState('');
    const [artist, setArtist] = useState('');
    const [priceRange, setPriceRange] = useState<PriceRange | ''>('');
    const [address, setAddress] = useState('');
    const [author, setAuthor] = useState('');
    const [seriesName, setSeriesName] = useState('');
    const [seriesOrder, setSeriesOrder] = useState('');
    const [startYear, setStartYear] = useState('');
    const [endYear, setEndYear] = useState('');

    const { FieldsComponent, handleDetailsInsert } = categoryConfig[category];
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !user) return;

        // Insert into 'items' table
        const itemToInsert: Item = {
            user_id: user.id,
            name,
            category,
            status,
            rating: status === 'ranked' ? 1000 : null,
            description: description.trim() === '' ? null : description,
        };
        
        const { data: newItem, error: itemError } = await supabase
            .from('items')
            .insert(itemToInsert)
            .select()
            .single();
        
        if (itemError || !newItem) {
            console.error('Error inserting item:', itemError);
            return;
        }

        // Insert into category-specific table
        const details = {
            release_year: parseOptionalInt(releaseYear),
            director: director.trim() || null,
            artist: artist.trim() || null,
            price_range: priceRange || null,
            address: address.trim() || null,
            author: author.trim() || null,
            series_name: seriesName.trim() || null,
            series_order: parseOptionalInt(seriesOrder),
            start_year: parseOptionalInt(startYear),
            end_year: parseOptionalInt(endYear),
        }

        if (handleDetailsInsert) {
            const { error: detailsError } = await handleDetailsInsert(newItem.id, details);
            if (detailsError) {
                console.error('Error inserting details:', detailsError);

                const { error: deleteError } = await supabase
                    .from('items')
                    .delete()
                    .eq('id', newItem.id);

                if (deleteError) {
                    console.error('CRITICAL: Failed to rollback item insert.', deleteError);
                }
                return;
            }
        }

        // Close Dialog
        setIsOpen(false);
        // Reset fields on success
        setName('');
        setDescription('');
        setStatus('ranked');
        // Reset category-specific fields
        setReleaseYear('');
        setDirector('');
        setArtist('');
        setPriceRange('');
        setAddress('');
        setAuthor('');
        setSeriesName('');
        setSeriesOrder('');
        setStartYear('');
        setEndYear('');
        // Refresh the list
        onSuccess();
    };

    const capitalizedCategory = category.charAt(0).toUpperCase() + category.slice(1);
    const statusText = status === 'ranked' ? 'Review' : 'to Backlog';
    const dialogTitle = `Add New ${capitalizedCategory} ${statusText}`;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="icon">
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Add Item</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{dialogTitle}</DialogTitle>
                    <DialogDescription>
                        Fields marked with <span className="text-destructive">*</span> are required.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="flex items-center space-x-2 justify-start">
                        <Label htmlFor="status-switch">Add to Backlog</Label>
                        <Switch
                            id="status-switch"
                            name="status"
                            checked={status === 'backlog'}
                            onCheckedChange={(checked) => setStatus(checked ? 'backlog' : 'ranked')}
                        />
                    </div>
                    <Separator />
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name <span className="text-destructive">*</span>
                            </Label>
                        <Input
                            id="name"
                            name="name"
                            autoComplete="off"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="description" className="text-right pt-2">
                            {status === 'ranked' ? 'Review' : 'Notes'}
                        </Label>
                        <Textarea
                            id="description"
                            name="description"
                            autoComplete="off"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="col-span-3"
                            placeholder={status === 'ranked' ? 'My review of this item...' : 'Add some notes...'}
                        />
                    </div>
                    <Separator />

                    <FieldsComponent
                        releaseYear={releaseYear} setReleaseYear={setReleaseYear}
                        director={director} setDirector={setDirector}
                        artist={artist} setArtist={setArtist}
                        priceRange={priceRange} setPriceRange={setPriceRange}
                        address={address} setAddress={setAddress}
                        author={author} setAuthor={setAuthor}
                        seriesName={seriesName} setSeriesName={setSeriesName}
                        seriesOrder={seriesOrder} setSeriesOrder={setSeriesOrder} 
                        startYear={startYear} setStartYear={setStartYear}
                        endYear={endYear} setEndYear={setEndYear}
                    />

                    <Button type="submit">Add</Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}