export const avatarNameAbbr = (avatarName) => {
  avatarName = avatarName.replace(/\s+/g, ' ').trim();
  let names = avatarName.split(' ');
  avatarName = '';
  names.slice(0, 2).forEach((n) => {
    avatarName = avatarName + n.charAt(0);
  });
  return avatarName.trim().toUpperCase();
};

export const avatarName = (avatarName) => {
  avatarName = avatarName.replace(/\s+/g, ' ').trim();
  let names = avatarName.split(' ');
  let name = '';
  names.forEach((n) => {
    name = name + ' ' + n.charAt(0).toUpperCase() + n.slice(1, n.length + 1);
  });
  return name.trim();
};

export const USERTYPE = {
  STANDARD: 'standard',
  GUEST: 'guest',
};

export const SLICESSIZES = {
  regular: [
    {
      rotate: 0,
      size: 100,
    },
    {
      rotate: 90,
      size: 100,
    },
    {
      rotate: 180,
      size: 100,
    },
    {
      rotate: 270,
      size: 100,
    },
  ],
  medium: [
    {
      rotate: 60,
      size: 130,
    },
    {
      rotate: 120,
      size: 130,
    },
    {
      rotate: 180,
      size: 130,
    },
    {
      rotate: 240,
      size: 130,
    },
    {
      rotate: 300,
      size: 130,
    },
    {
      rotate: 360,
      size: 130,
    },
  ],
  large: [
    {
      rotate: 45,
      size: 150,
    },
    {
      rotate: 90,
      size: 150,
    },
    {
      rotate: 135,
      size: 150,
    },
    {
      rotate: 180,
      size: 150,
    },
    {
      rotate: 225,
      size: 150,
    },
    {
      rotate: 270,
      size: 150,
    },
    {
      rotate: 315,
      size: 150,
    },
    {
      rotate: 360,
      size: 150,
    },
  ],
  extraLarge: [
    {
      rotate: 36 * 2,
      size: 54,
    },
    {
      rotate: 36 * 3,
      size: 54,
    },
    {
      rotate: 36 * 4,
      size: 54,
    },
    {
      rotate: 36 * 5,
      size: 54,
    },
    {
      rotate: 36 * 6,
      size: 54,
    },
    {
      rotate: 36 * 7,
      size: 54,
    },
    {
      rotate: 36 * 8,
      size: 54,
    },
    {
      rotate: 36 * 9,
      size: 54,
    },
    {
      rotate: 36 * 10,
      size: 54,
    },
    {
      rotate: 36 * 11,
      size: 54,
    },
  ],
};

export const TOPPING_COUNT = {
  SMALL_PIZZA: {
    regular: 2,
    medium: 3,
  },
  MEDIUM_PIZZA: {
    regular: 3,
    medium: 4,
  },
  LARGE_PIZZA: {
    regular: 4,
    medium: 5,
  },
};

export const PIZZASIZES = {
  R: 'regular',
  M: 'medium',
  L: 'large',
};
