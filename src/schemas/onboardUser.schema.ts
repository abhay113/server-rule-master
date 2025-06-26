import Joi from 'joi';

export const onboardUserSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    firstName: Joi.string().min(1).required(),
    lastName: Joi.string().min(1).required(),
    password: Joi.string().min(6).required(),
    groupName: Joi.string().required(),
    roleName: Joi.string().required(),
});
