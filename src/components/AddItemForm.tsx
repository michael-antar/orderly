import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { type Category, type Item, type Status } from "@/types/types";

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus } from 'lucide-react';

type AddItemFormProps = {
    category: Category;
    onSuccess: () => void; // Callback to refresh the list
};

export function AddItemForm({ category, onSuccess }: AddItemFormProps) {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<Status>('backlog');
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !user) return;

        const itemToInsert: Item = {
            name,
            category,
            description: description.trim() === '' ? null : description,
            status,
            user_id: user.id
        };

        if (status === 'ranked') {
            itemToInsert.rating = 1000;
        }

        // Insert into 'items' table
        const { data: newItem, error: itemError } = await supabase
            .from('items')
            .insert(itemToInsert)
            .select()
            .single();
        
        if (itemError || !newItem) {
            console.error('Error inserting item:', itemError);
            return;
        }

        // TODO: Insert into the category-specific 'details' tables

        // Close Dialog
        setIsOpen(false);
        // Reset fields on success
        setName('');
        setDescription('');
        setStatus('backlog');
        // Refresh the list
        onSuccess();
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New {category}</DialogTitle>
                    <DialogDescription>
                        Enter the details for the new item. Click "Add" when you're done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
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
                        <Label htmlFor="description" className="text-right pt-2">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            autoComplete="off"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="col-span-3"
                            placeholder="Add a description..."
                        />
                    </div>
                    <div className="flex items-center space-x-2 justify-end">
                        <Label htmlFor="status-switch">Add to Ranked List</Label>
                        <Switch
                            id="status-switch"
                            name="status"
                            checked={status === 'ranked'}
                            onCheckedChange={(checked) => setStatus(checked ? 'ranked' : 'backlog')}
                        />
                    </div>
                    {/* TODO: Add more inputs for category-specific fields here */}
                    <Button type="submit">Add</Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}