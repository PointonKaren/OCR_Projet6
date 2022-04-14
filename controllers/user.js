const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("email-validator"); // Permet de vérifier que la syntaxe d'écriture du mail est correcte (comme avec des regex)

exports.signup = (req, res, next) => {
  if (validator.validate(req.body.email)) {
    bcrypt
      .hash(req.body.password, 10) // Permet de crypter un mdp écrit par l'utilisateur avec la méthode hash sur 10 cycles d'encryptage. Fonction asynchrone donc renvoie une promise
      .then((hashedPassword) => {
        // .then permet de résoudre la promise renvoyée par la méthode hash ci-dessus quand ça fonctionne
        const user = new User({
          // Création d'une instance de User contenant le mail entré par l'utilisateur et le mdp crypté avec la méthode hash
          email: req.body.email,
          password: hashedPassword,
        });
        user
          .save() // Intègre dans la BDD les infos contenues dans la variable user. Cette intégration renvoie une promise qui doit être résolue par .then et .catch
          .then(
            () => res.status(201).json({ message: "Utilisateur créé." }) // Si l'intégration s'est bien passée, renvoyer un message "Utilisateur créé."
          )
          .catch((error) => res.status(400).json({ error })); // Si l'intégration se passe mal, la promise renvoie une erreur. La réponse prend un statut 400 et communique l'erreur survenue
      })
      .catch((error) => res.status(500).json({ error })); // Si le hash n'a pas fonctionné, la réponse prend un statut 500 qui signifie erreur serveur. Elle communique aussi au front l'erreur associée.
  } else {
    return res.status(400).json({ error: "Syntaxe de mail incorrecte." });
  }
};

exports.login = (req, res, next) => {
  User.findOne({ email: req.body.email }) // Permet de voir si l'email entré par l'utilisateur existe dans la BDD en renvoyant une promise.
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé." });
        // Si findOne n'a pas permis de trouver un email dans la BDD, renvoyer au front le statut 404 (ressource non trouvée) et mesasge d'erreur associé et sort de ce controller
      }
      bcrypt
        .compare(req.body.password, user.password)
        // Si user trouvé, utilisation de la méthode compare de bcrypt pour comparer le mdp entré par l'utilisateur et celui stocké dans la bdd.
        .then((samePassword) => {
          if (!samePassword) {
            return res.status(401).json({ error: "Mot de passe incorrect." });
            // Si le mdp n'est pas identique, renvoyer au front statut 401 (non authentifié) et message d'erreur associé.
          }
          res.status(200).json({
            userId: user._id, // associe l'id de la bdd au userId du front
            token: jwt.sign(
              // génère un token encodé à partir de l'user du findOne et d'une clé d'encodage aléatoirement générée.
              { userId: user._id },
              process.env.SECRET_KEY, // clé d'encodage qui sera utilisée pour chaque encodage, unique au site, générée aléatoirement
              {
                expiresIn: "24h", // Durée avant expiration du token et donc de la connexion (une fois expiré, nouvelle connexion obligatoire)
              }
            ),
          });
        })
        .catch((error) => res.status(500).json({ error })); // Si la comparaison n'a pas fonctionné, renvoyer au front statut 500 et l'erreur associée
    }) // L'utilisateur existe
    .catch((error) => res.status(500).json({ error })); // Si le findOne n'a pas fonctionné, renvoyer au front statut 500 et l'erreur associée
};
