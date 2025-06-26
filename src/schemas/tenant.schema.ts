import Joi from 'joi';

export const createTenantSchema = Joi.object({
    realmName: Joi.string().min(3).max(50).required()
});
export const updateTenantSchema = Joi.object({
    newRealmName: Joi.string().min(3).max(50).optional()
});