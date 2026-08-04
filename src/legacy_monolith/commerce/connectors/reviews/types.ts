export interface Review {
    id: string;
    tenantId: string;
    source: string;       // 'google' | 'tripadvisor' | 'thefork' | ...
    externalId: string;
    authorName: string;
    rating: number;       // 1-5
    text?: string;
    date: string;         // ISO 8601
    replyText?: string;
    replyDate?: string;
    url?: string;
}

export interface IReviewProvider {
    readonly id: string;
    fetchRecent(tenantId: string, since: Date): Promise<Review[]>;
    postReply(reviewId: string, text: string): Promise<void>;
    getAverageScore(tenantId: string): Promise<number>;
}
