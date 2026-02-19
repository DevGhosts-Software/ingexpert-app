import { z, ZodObject, ZodRawShape } from "zod";
import { basePaginationSchema } from "./pagination-types";
import { PrismaClient } from "@ingexpert/database";
type PrismaDelegate = {
    findMany: (args: any) => Promise<any[]>;
    count: (args: any) => Promise<number>;
};

export function createPaginatedProcedure<T extends ZodRawShape>(
    procedure: any,
    getDelegate: (prisma: PrismaClient) => PrismaDelegate, // <--- EL CAMBIO CLAVE
    filterSchema: ZodObject<T>,
    searchableFields: string[]
) {
    return procedure
        .input(
            basePaginationSchema.extend({
                filters: filterSchema.optional(),
            })
        )
        .query(async ({ ctx, input }: any) => {
            const { page, limit, search, filters } = input;
            const skip = (page - 1) * limit;

            const where: any = {
                AND: [],
            };

            if (filters) {
                Object.entries(filters).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        where.AND.push({ [key]: value });
                    }
                });
            }

            if (search && searchableFields.length > 0) {
                const searchConditions = searchableFields.map((field: string) => ({
                    [field]: { contains: search, mode: "insensitive" },
                }));
                where.AND.push({ OR: searchConditions });
            }

            // Ejecutamos el selector para obtener la tabla correcta desde el contexto
            const dbDelegate = getDelegate(ctx.prisma);

            const [total, items] = await ctx.prisma.$transaction([
                dbDelegate.count({ where }),
                dbDelegate.findMany({
                    where,
                    take: limit,
                    skip,
                    orderBy: { id: "desc" },
                }),
            ]);

            return {
                data: items,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                    hasNextPage: page * limit < total,
                    hasPreviousPage: page > 1,
                },
            };
        });
}