import Joi from "joi";

export const loginSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
});

export const logoutSchema = Joi.object({
  refresh_token: Joi.string().required(),
});