const badwords = require("./badwords");

function maskWord(w) {
  if (w.length <= 2) return "*".repeat(w.length);
  return w[0] + "*".repeat(w.length - 2) + w[w.length - 1];
}

module.exports = function filterText(text = "") {
  let out = text;
  for (const w of badwords) {
    const re = new RegExp(w, "gi");
    out = out.replace(re, maskWord(w));
  }
  return out;
};
