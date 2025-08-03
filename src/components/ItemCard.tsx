import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type CombinedItem } from "@/types/types";

type ItemCardProps = {
    item: CombinedItem;
};

export const ItemCard = ({ item }: ItemCardProps) => {
    const { name, category, status, rating, description} = item;

    const renderCategoryDetails = () => {
        switch (category) {
            case 'album':
                return (
                    <>
                        {item.album_details?.artist && <p><strong>Artist:</strong> {item.album_details.artist}</p>}
                        {item.album_details?.release_year && <p><strong>Release Year:</strong> {item.album_details.release_year}</p>}
                    </>
                );
            case 'book':
                return (
                    <>
                        {item.book_details?.author && <p><strong>Author:</strong> {item.book_details.author}</p>}
                        {item.book_details?.series_name && <p><strong>Series:</strong> {item.book_details.series_name}</p>}
                        {item.book_details?.series_order && <p><strong>Series Order:</strong> {item.book_details.series_order}</p>}
                        {item.book_details?.release_year && <p><strong>Release Year:</strong> {item.book_details.release_year}</p>}
                    </>
                );
            case 'movie':
                return (
                    <>
                        {item.movie_details?.director && <p><strong>Director:</strong> {item.movie_details.director}</p>}
                        {item.movie_details?.release_year && <p><strong>Release Year:</strong> {item.movie_details.release_year}</p>}
                    </>
                );
            case 'restaurant':
                return (
                    <>
                        {item.restaurant_details?.price_range && <p><strong>Price Range:</strong> {item.restaurant_details.price_range}</p>}
                        {item.restaurant_details?.address && <p><strong>Address:</strong> {item.restaurant_details.address}</p>}
                    </>
                );
            case 'show':
                return (
                    <>
                        {item.show_details?.start_year && <p><strong>Start Year:</strong> {item.show_details.start_year}</p>}
                        {item.show_details?.end_year && <p><strong>End Year:</strong> {item.show_details.end_year}</p>}
                    </>
                );
            default:
                return null;
        }
    }

    return (
        <Card className="mb-4">
            <CardHeader>
                <CardTitle>{name}</CardTitle>
                <CardDescription className="capitalize">
                    {status} {status === 'ranked' && `(Elo: ${rating})`}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {description && <p className="text-muted-foreground">{description}</p>}
                <div className="text-foreground">{renderCategoryDetails()}</div>
            </CardContent>
        </Card>
    );
}