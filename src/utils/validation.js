export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validatePhone = (phone) => {
  return phone.length >= 10;
};

export const validatePassword = (password) => {
  return password.length >= 6;
};