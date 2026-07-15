import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { BadRequestError } from '../utils/errors';

export function validate(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Zod schemas will wrap body, query, and params as objects
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
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
