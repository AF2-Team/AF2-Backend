import { PaginationMetadata, ProcessedQueryFilters } from '@rules/api-query.type.js';

/**
 * QueryBuilder - Utilidad para procesar query parameters de la API
 * Maneja paginación, ordenamiento y filtros
 */
export class QueryBuilder {
    // Constantes para valores por defecto
    private static readonly DEFAULT_PAGE = 1;
    private static readonly DEFAULT_LIMIT = 10;
    private static readonly NO_LIMIT = -1;

    /**
     * Construye ProcessedQueryFilters a partir de query string
     * Maneja casos donde NO hay order.* ni qc.* (retorna arrays/objetos vacíos)
     */
    static buildFromQuery(query: Record<string, any>): ProcessedQueryFilters {
        // Extraer parámetros con desestructuración segura
        const safeQuery= query || {};
        const { page: qPage = this.DEFAULT_PAGE, limit: qLimit = this.DEFAULT_LIMIT, ...restQuery } = safeQuery;

        // 1. Procesar paginación
        const page = this.safeNumber(qPage, this.DEFAULT_PAGE);
        const limit = this.safeNumber(qLimit, this.DEFAULT_LIMIT, true); // true = permite -1

        const pagination: ProcessedQueryFilters['pagination'] = {
            offset: Math.max(page - 1, 0),
        };

        if (limit > this.NO_LIMIT) {
            pagination.limit = Math.max(limit, 1);
            pagination.offset = pagination.offset * pagination.limit;
        }

        // 2. Procesar ordenamiento (SOLO si hay parámetros order.*)
        const order: ProcessedQueryFilters['order'] = [];

        for (const [key, value] of Object.entries(restQuery)) {
            if (key.startsWith('order.')) {
                const direction = String(value).toLowerCase();
                if (direction === 'asc' || direction === 'desc') {
                    const field = key.substring(6); // Remover 'order.'
                    if (field) {
                        // Verificar que el campo no esté vacío
                        order.push([field, direction as 'asc' | 'desc']);
                    }
                }
            }
        }

        // 3. Procesar condiciones de query (SOLO si hay parámetros qc.*)
        const qc: ProcessedQueryFilters['qc'] = {};

        for (const [key, value] of Object.entries(restQuery)) {
            if (key.startsWith('qc.')) {
                const field = key.substring(3); // Remover 'qc.'
                if (field) {
                    // Verificar que el campo no esté vacío
                    qc[field] = this.parseValue(value);
                }
            }
        }

        return {
            pagination,
            order,
            qc,
            raw: { ...query }, // Copia del query original
        };
    }

    /**
     * Construye metadata de paginación según el estándar ApiResponse
     */
    static buildPaginationMetadata(count: number, offset: number, limit?: number): PaginationMetadata {
        const actualLimit = limit ?? count;

        // Validaciones para evitar errores matemáticos
        if (actualLimit <= 0) {
            return {
                total: count,
                per_page: 0,
                current_page: 1,
                total_pages: 0,
                next_page: null,
                prev_page: null,
            };
        }

        const totalPages = Math.ceil(count / actualLimit);
        const currentPage = Math.floor(offset / actualLimit) + 1;

        // Asegurar que currentPage esté dentro de los límites
        const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages || 1);

        return {
            total: count,
            per_page: actualLimit,
            current_page: safeCurrentPage,
            total_pages: totalPages,
            next_page: safeCurrentPage < totalPages ? safeCurrentPage + 1 : null,
            prev_page: safeCurrentPage > 1 ? safeCurrentPage - 1 : null,
        };
    }

    /**
     * Procesa respuesta según diferentes formatos y aplica metadata si es necesario
     */
    static processResponse(
        data: any,
        filters?: ProcessedQueryFilters | null,
    ): {
        data: any;
        metadata?: PaginationMetadata;
    } {
        // Caso: datos nulos
        if (data === null || data === undefined) return { data: null };

        // Clonar para no modificar el original
        const clonedData = this.deepClone(data);

        // Detectar tipo de respuesta
        const responseType = this.detectResponseType(clonedData);

        switch (responseType) {
            case 'primitive':
                return { data: clonedData };

            case 'single-row':
                return { data: clonedData.row };

            case 'paginated-result':
                const count = this.extractCount(clonedData);
                const dataArray = this.extractDataArray(clonedData);

                let metadata: PaginationMetadata | undefined;

                if (filters) {
                    // Usar filtros de la request
                    metadata = this.buildPaginationMetadata(count, filters.pagination.offset, filters.pagination.limit);
                } else if (clonedData.limit !== undefined) {
                    // Usar límite de la respuesta si está disponible
                    metadata = this.buildPaginationMetadata(count, clonedData.offset || 0, clonedData.limit);
                }

                return {
                    data: dataArray,
                    metadata,
                };

            case 'array':
                if (filters) {
                    const metadata = this.buildPaginationMetadata(
                        clonedData.length,
                        filters.pagination.offset,
                        filters.pagination.limit,
                    );

                    return {
                        data: clonedData,
                        metadata,
                    };
                }
                return { data: clonedData };

            default:
                return { data: clonedData };
        }
    }

    /**
     * Extrae el conteo total de diferentes formatos de respuesta
     */
    private static extractCount(data: any): number {
        if (data.count !== undefined) return data.count;
        if (data.total !== undefined) return data.total;
        if (Array.isArray(data)) return data.length;
        if (data.rows && Array.isArray(data.rows)) return data.rows.length;
        if (data.data && Array.isArray(data.data)) return data.data.length;
        return 0;
    }

    /**
     * Extrae el array de datos de diferentes formatos
     */
    private static extractDataArray(data: any): any[] {
        if (Array.isArray(data)) return data;
        if (data.rows && Array.isArray(data.rows)) return data.rows;
        if (data.data && Array.isArray(data.data)) return data.data;
        return [];
    }

    /**
     * Detecta el tipo de respuesta para procesarla adecuadamente
     */
    private static detectResponseType(data: any): 'primitive' | 'array' | 'single-row' | 'paginated-result' {
        // Casos base
        if (data === null || data === undefined) return 'primitive';

        const type = typeof data;
        if (type !== 'object' && type !== 'function') return 'primitive';

        // Arrays
        if (Array.isArray(data)) return 'array';

        // Objetos
        const keys = Object.keys(data);

        // Formato { row: data } (single-row)
        if (keys.length === 1 && keys[0] === 'row') return 'single-row';

        // Formato paginado
        const hasRows = 'rows' in data && Array.isArray(data.rows);
        const hasData = 'data' in data && Array.isArray(data.data);
        const hasCount = 'count' in data && typeof data.count === 'number';
        const hasTotal = 'total' in data && typeof data.total === 'number';

        if ((hasRows && hasCount) || (hasData && hasTotal)) return 'paginated-result';

        // Objeto regular
        return 'primitive';
    }

    /**
     * Parsea valores de query de forma inteligente
     */
    public static parseValue(value: any): any {
        if (value === null || value === undefined) return value;

        // Si no es string, retornar tal cual
        if (typeof value !== 'string') return value;

        const trimmed = value.trim();
        if (trimmed === '') return trimmed;

        // Booleanos
        const lowerTrimmed = trimmed.toLowerCase();
        if (lowerTrimmed === 'true') return true;
        if (lowerTrimmed === 'false') return false;

        // Números enteros
        if (/^-?\d+$/.test(trimmed)) {
            const num = parseInt(trimmed, 10);
            return isNaN(num) ? trimmed : num;
        }

        // Números decimales
        if (/^-?\d*\.\d+$/.test(trimmed)) {
            const num = parseFloat(trimmed);
            return isNaN(num) ? trimmed : num;
        }

        // Null
        if (lowerTrimmed === 'null') return null;

        // Undefined
        if (lowerTrimmed === 'undefined') return undefined;

        // Arrays (comma-separated)
        if (trimmed.includes(',')) {
            return trimmed
                .split(',')
                .map((item) => this.parseValue(item.trim()))
                .filter((item) => item !== undefined && item !== '');
        }

        // String por defecto
        return trimmed;
    }

    /**
     * Convierte a número de forma segura
     */
    private static safeNumber(value: any, defaultValue: number, allowNegativeOne: boolean = false): number {
        if (value == null || value === '') return defaultValue;

        const num = Number(value);
        if (isNaN(num)) return defaultValue;

        // Permitir -1 para "sin límite"
        if (allowNegativeOne && num === -1) return -1;

        return Math.max(num, 1);
    }

    /**
     * Clona objetos de forma segura preservando tipos especiales
     */
    private static deepClone(obj: any): any {
        // Valores primitivos, null, undefined
        if (obj === null || typeof obj !== 'object') return obj;

        // Date
        if (obj instanceof Date) return new Date(obj.getTime());

        // Array
        if (Array.isArray(obj)) return obj.map((item) => this.deepClone(item));

        // Object
        if (typeof obj === 'object') {
            const cloned: Record<string, any> = {};

            for (const key in obj)
                if (Object.prototype.hasOwnProperty.call(obj, key)) cloned[key] = this.deepClone(obj[key]);

            return cloned;
        }

        return obj;
    }

    /**
     * Extrae solo los parámetros de filtro (excluyendo paginación, orden, etc.)
     */
    static extractFilterParams(query: Record<string, any>): Record<string, any> {
        const filterParams: Record<string, any> = {};

        for (const [key, value] of Object.entries(query)) {
            // Excluir parámetros especiales
            if (key === 'page' || key === 'limit' || key.startsWith('order.') || key.startsWith('qc.')) continue;

            const parsedValue = this.parseValue(value);
            if (parsedValue !== undefined && parsedValue !== '') filterParams[key] = parsedValue;
        }

        return filterParams;
    }

    /**
     * Valida que los parámetros de orden sean válidos
     */
    static validateOrderParams(order: ProcessedQueryFilters['order']): {
        valid: ProcessedQueryFilters['order'];
        invalid: Array<[string, string]>;
    } {
        const valid: ProcessedQueryFilters['order'] = [];
        const invalid: Array<[string, string]> = [];

        for (const [field, direction] of order) {
            // Validar que el campo no esté vacío y la dirección sea válida
            if (field && field.trim() && (direction === 'asc' || direction === 'desc'))
                valid.push([field.trim(), direction]);
            else invalid.push([field, direction]);
        }

        return { valid, invalid };
    }
}
