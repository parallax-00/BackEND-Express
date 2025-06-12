// This utility function acts as a wrapper, instead of making multiple async functions in multiple files and parts, we can make a single asyncHandler fuction which will accept a function as a paramenter and resolve the req, res, next. Using async cause //* The database is always in another continent therefore there will be delays in response and with async we can make Promises or use Try-Catch.

const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };

//* ***********Try - Catch Syntax ***********
//const asyncHandler = (function) => {()=>{}} //! Higher order function
// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (error) {
//     res.status(error.code || 500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
