const jwt = require("jsonwebtoken");

/**
 * Authentification de l'utilisateur
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
module.exports = (req, res, next) => {
  try {
    // Vérification de l'id contenu dans le token dans la requête
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
    req.auth = { userId: decodedToken.userId };

    if (req.body.userId && req.body.userId !== decodedToken.userId) {
      // S'il y a un userId dans le corps de la requête et qu'il diffère de celui contenu dans le token
      throw "Requête non autorisée.";
    } else {
      next();
    }
  } catch (error) {
    res.status(403).json({ error });
  }
};
