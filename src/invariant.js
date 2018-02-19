export default function invariant(condition, message, ...args) {
  if (!condition) {
    let idx = 0;

    throw new Error(message.replace(/%s/g, () => args[idx++])); // eslint-disable-line no-plusplus
  }
}
