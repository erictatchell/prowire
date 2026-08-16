const { handleContact } = require("./contact");

module.exports = function handler(request, response) {
  return handleContact(request, response, "erictatch@gmail.com");
};
