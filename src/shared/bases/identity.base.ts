export abstract class BaseEntity {
    id?: string;
    createdAt: Date;
    updatedAt: Date;

    constructor() {
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    updateTimestamps(): void {
        this.updatedAt = new Date();
    }

    toJSON(): any {
        const obj: any = { ...this };

        delete obj._id;
        delete obj.__v;
        delete obj.password;

        return obj;
    }

    protected validateRequired(fields: string[], data: any): void {
        const missingFields = fields.filter(
            (field) => data[field] === undefined || data[field] === null || data[field] === '',
        );

        if (missingFields.length > 0) throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
}
