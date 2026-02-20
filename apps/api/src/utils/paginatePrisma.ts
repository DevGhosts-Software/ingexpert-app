export interface PaginateMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export async function paginatePrisma<T = unknown>(
  modelDelegate: any,
  params: {
    page?: number;
    limit?: number;
    search?: string;
    filters?: any;
    orderBy?: string;
    orderDir?: 'asc' | 'desc';
  },
  searchFields: string[],
): Promise<{ data: T[]; meta: PaginateMeta }> {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const skip = (page - 1) * limit;

  const where: any = { AND: [] };

  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        where.AND.push({ [key]: value });
      }
    });
  }

  // 2. Aplicar buscador dinámico
  if (params.search && searchFields.length > 0) {
    const searchConditions = searchFields.map((field) => ({
      [field]: { contains: params.search, mode: 'insensitive' },
    }));
    where.AND.push({ OR: searchConditions });
  }

  // Limpiar el AND si está vacío para no romper Prisma
  if (where.AND.length === 0) {
    delete where.AND;
  }

  const orderBy = params.orderBy ? { [params.orderBy]: params.orderDir ?? 'asc' } : { id: 'desc' };

  // 3. Ejecutar transacción paralela
  const [total, data] = await Promise.all([
    modelDelegate.count({ where }),
    modelDelegate.findMany({
      where,
      take: limit,
      skip,
      orderBy,
    }),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
}
