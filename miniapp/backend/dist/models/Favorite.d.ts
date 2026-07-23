import mongoose, { Document } from 'mongoose';
export interface IFavorite extends Document {
    userId: mongoose.Types.ObjectId;
    itemType: 'practice_project' | 'real_project' | 'decomposition_report' | 'comparison_report' | 'growth_path' | 'achievement';
    itemId: mongoose.Types.ObjectId;
    snapshot: {
        title: string;
        description?: string;
        imageUrl?: string;
        tags?: string[];
    };
    userNote?: string;
    category?: string;
    isPinned: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Favorite: mongoose.Model<IFavorite, {}, {}, {}, mongoose.Document<unknown, {}, IFavorite, {}, {}> & IFavorite & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Favorite.d.ts.map