import { books } from "@/constants/books";

const Card = () => {
    return (
        <>
            {books.slice(0, 1).map((item) => (
                <div
                    key={item.id}
                    className="w-70 rounded-lg overflow-hidden border-3 border-stone-100 bg-stone-200 bg-opacity-40 flex hover:bg-opacity-60 transition-all duration-300"
                >
                    {/* Image */}
                    <div className="relative h-48 bg-stone-200 flex items-center justify-center">
                        <div className=" bg-stone-500 rounded-sm border-4 border-stone-600 flex items-center justify-center">
                            <div className="space-y-2">
                                <img
                                    src={item.image}
                                    alt={item.bookName}
                                    className="w-25 h-40 object-cover rounded-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Text */}
                    <div className="p-4 space-y-1">
                        <h2 className="text-2xl font-bold text-stone-800">
                            {item.bookName}
                        </h2>

                        <p className="text-stone-700 font-medium">
                            {item.authorName}
                        </p>

                        <div className="text-sm text-stone-600">
                            <p>{item.pages}</p>
                        </div>

                        <div className="pt-3 space-y-1 text-sm text-stone-600">
                            <p>{item.publishedDate}</p>
                            <p>{item.lastUpdatedDate}</p>
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
};

export default Card;