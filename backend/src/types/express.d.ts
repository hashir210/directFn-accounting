declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        organizationId: string;
        roleId: string;
      };
    }
  }
}

export {};
