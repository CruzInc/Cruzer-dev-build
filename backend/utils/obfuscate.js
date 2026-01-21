// Obfuscation utility for sensitive credentials
// Converts strings to character code arrays for basic obfuscation

/**
 * Obfuscate a string by converting to character codes
 */
function obfuscateString(str) {
  return JSON.stringify(str.split('').map(c => c.charCodeAt(0)));
}

/**
 * De-obfuscate by converting character codes back to string
 */
function deobfuscateString(obfuscated) {
  return JSON.parse(obfuscated).map(code => String.fromCharCode(code)).join('');
}

module.exports = {
  obfuscateString,
  deobfuscateString,
};
