// Example usage of the validation middleware

// 1. Define validation schemas
export const userValidation = {
  signup: {
    body: {
      required: ['userName', 'email', 'password', 'confirmPassword', 'role'],
      allowed: ['userName', 'email', 'password', 'confirmPassword', 'role', 'firstName', 'lastName']
    }
  },  login: {
    body: {
      required: ['password'],
      allowed: ['email', 'userName', 'password', 'rememberMe'],
      custom: (body) => {
        if (!body.email && !body.userName) {
          return 'Either email or userName is required';
        }
        return null;
      }
    }
  },
  userApproval: {
    params: {
      required: ['userId'],
    },
    body: {
      allowed: ['status', 'message']
    }
  }
};

// 2. Use in routes like:
// router.post('/signup', validate(userValidation.signup), AuthController.signup);
// router.post('/login', validate(userValidation.login), AuthController.login);
