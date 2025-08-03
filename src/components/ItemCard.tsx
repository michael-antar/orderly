import { Card } from "@/components/ui/card";
import { type CombinedItem } from "@/types/types";

type ItemCardProps = {
    item: CombinedItem;
};

const getCategoryDetails = (item: CombinedItem): string => {
    const details: string[] = [];
    switch (item.category) {
        case 'movie':
            if (item.movie_details?.director) details.push(item.movie_details.director);
            if (item.movie_details?.release_year) details.push(String(item.movie_details.release_year));
            break;
        case 'album':
            if (item.album_details?.artist) details.push(item.album_details.artist);
            if (item.album_details?.release_year) details.push(String(item.album_details.release_year));
            break;
        case 'book':
            if (item.book_details?.author) details.push(item.book_details.author);
            if (item.book_details?.series_name) details.push(item.book_details.series_name);
            break;
        case 'show':
            if (item.show_details?.start_year) {
                const years = item.show_details.end_year ? `${item.show_details.start_year}-${item.show_details.end_year}` : String(item.show_details.start_year);
                details.push(years);
            }
            break;
        case 'restaurant':
            if (item.restaurant_details?.price_range) details.push(item.restaurant_details.price_range);
            if (item.restaurant_details?.address) details.push(item.restaurant_details.address);
            break;
    }
    return details.filter(Boolean).join(', ');
};

export const ItemCard = ({ item }: ItemCardProps) => {
    const { name, status, rating } = item;
    const detailsString = getCategoryDetails(item);

    return (
        <Card className="mb-4 p-4">
            <div className="flex flex-col">
                <div className="flex items-baseline">
                    <h3 className="text-xl font-semibold truncate">{name}</h3>
                    {status === 'ranked' && (
                        <span className="ml-2 text-sm font-normal text-muted-foreground">{rating}</span>
                    )}
                </div>
                {detailsString && (
                    <p className="text-sm text-muted-foreground truncate">{detailsString}</p>
                )}
            </div>
        </Card>
    );
}