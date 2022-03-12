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
