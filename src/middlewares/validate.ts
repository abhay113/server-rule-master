import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

const validate = (schema: Joi.ObjectSchema) => (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);
    if (error) {
        res.status(400).json({ error: error.details[0].message });
    } else {
        next();
    }
};

export default validate;
