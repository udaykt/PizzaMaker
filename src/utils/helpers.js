export const avatarName = (avatarName) => {
  avatarName = avatarName.replace(/\s+/g, ' ').trim();
  let names = avatarName.split(' ');
  let name = '';
  names.forEach((n) => {
    name = name + ' ' + n.charAt(0).toUpperCase() + n.slice(1, n.length + 1);
  });
  return name.trim();
};

// "Small" matches real chain terminology (Domino's, Pizza Hut, Papa John's
// all call their smallest size "Small", never "Regular").
export const PIZZASIZES = {
  R: 'small',
  M: 'medium',
  L: 'large',
};
