// Middleware qui permet de sécuriser les routes à protéger (exemple delete une sauce etc)
// Ainsi, seul l'utilisateur pourra supprimer ou modifier, par exemple, les sauces qu'il aura ajouté.

const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    // Récupère le header.authorization et le sépare par l'espace (" ") ce qui donne un tableau qui contient en index 0 "Bearer" et en index 1 le token.
    // C'est ce token en index 1 qui est de fait stocké dans la variable token.
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY); // Vérifie/décode le token avec la clé d'encodage (cf user.js de controllers)
    req.auth = { userId: decodedToken.userId }; // Ajoute à la requête un objet "auth" qui contient le userId stocké dans le token.

    if (req.body.userId && req.body.userId !== decodedToken.userId) {
      // S'il y a un userId dans le corps de la requête et qu'il diffère de celui contenu dans le token
      throw "Requête non autorisée."; // Alors renvoyer une erreur "requête non autorisée" qui force le catch.
    } else {
      next();
    }
  } catch (error) {
    res.status(403).json({ error });
  }
};
