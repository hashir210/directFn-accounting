import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { BadRequestError } from '../utils/errors';

export function validate(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Zod schemas will wrap body, query, and params as objects
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as { body?: unknown; query?: unknown; params?: unknown };

      // Persist coerced/defaulted/transformed values back onto the request so
      // downstream handlers see the validated data (e.g. Zod defaults).
      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined) req.query = parsed.query as Request['query'];
      if (parsed.params !== undefined) req.params = parsed.params as Request['params'];

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.errors.map((err) => {
          // Remove the top level selector (e.g. 'body', 'query', 'params') from path
          const path = err.path.slice(1).join('.');
          return {
            field: path || err.path[0],
            message: err.message,
          };
        });
        next(new BadRequestError('Validation Failed', 'VALIDATION_ERROR', issues));
      } else {
        next(error);
      }
    }
  };
}
