/**
 * @fileoverview UID generator, from Blockly.
 */

/**
 * Legal characters for the unique ID.
 * Should be all on a US keyboard.  No XML special characters or control codes.
 * @private
 */
const SOUP =
  "!#%()*+,-./:;=?@[]^_`{|}~" +
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const SOUP_LEN = SOUP.length;
const ID_LEN = 20;
const reusedIdCarrier = Array(ID_LEN);

/**
 * Generate a unique ID, from Blockly.  This should be globally unique.
 * 87 characters ^ 20 length > 128 bits (better than a UUID).
 */
export const genUID = (): string => {
  for (let i = 0; i < ID_LEN; i++) {
    reusedIdCarrier[i] = SOUP.charAt(Math.random() * SOUP_LEN);
  }
  return reusedIdCarrier.join("");
};
