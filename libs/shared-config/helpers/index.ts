import * as bcrypt from 'bcrypt';

const saltRounds = 10;

/**
 * Hash a password using bcrypt
 */
export const encryptPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, saltRounds);
};

/**
 * Compare a plain text password with a hashed password
 */
export const checkPassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate a random password
 */
export const generateRandomPassword = (length: number = 12): string => {
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset.charAt(randomIndex);
  }
  return password;
};

/**
 * Convert camelCase to snake_case
 */
export const camelToSnake = (camelCase: string): string => {
  return camelCase.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
};

/**
 * Convert snake_case to camelCase
 */
export const snakeToCamel = (snakeCase: string): string => {
  return snakeCase.replace(/_([a-z])/g, (match, group) => group.toUpperCase());
};

/**
 * Convert an object with camelCase keys to snake_case keys
 */
export const camelObjToSnakeObj = (camelObj: Record<string, any>): Record<string, any> => {
  const snakeObj: Record<string, any> = {};
  for (const key in camelObj) {
    snakeObj[camelToSnake(key)] = camelObj[key];
  }
  return snakeObj;
};

/**
 * Convert an object with snake_case keys to camelCase keys
 */
export const snakeObjToCamelObj = (snakeObj: Record<string, any>): Record<string, any> => {
  const camelObj: Record<string, any> = {};
  for (const key in snakeObj) {
    camelObj[snakeToCamel(key)] = snakeObj[key];
  }
  return camelObj;
};
