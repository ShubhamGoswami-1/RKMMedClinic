/**
 * Async error handler to avoid try-catch blocks in controllers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
export const asyncErrorHandler = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};