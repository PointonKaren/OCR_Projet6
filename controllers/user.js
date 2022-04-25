const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const emailValidator = require("email-validator");
const passwordValidator = require("password-validator");

/**
 * S'enregistrer sur le site
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 */
exports.signup = (req, res, next) => {
  const passwordSchema = new passwordValidator();

  passwordSchema
    .is()
    .min(8, "Le mot de passe doit contenir minimum 8 caractères.")
    .is()
    .max(100, "Le mot de passe doit contenir maximum 100 caractères.")
    .has()
    .uppercase(1, "Le mot de passe doit contenir au moins 1 majuscule.")
    .has()
    .lowercase(1, "Le mot de passe doit contenir au moins 1 minuscule.")
    .has()
    .digits(2, "Le mot de passe doit contenir au moins 2 chiffres.")
    .has()
    .not()
    .spaces();

  if (!passwordSchema.validate(req.body.password)) {
    // Si le password créé ne rentre pas dans les conditions
    let errorMessage = "";
    const errors = passwordSchema.validate(req.body.password, {
      details: true,
    });
    for (let i in errors) {
      errorMessage += errors[i].message + " ";
    }
    return res.status(400).json({
      message: errorMessage,
    });
  }

  if (emailValidator.validate(req.body.email)) {
    // Si la syntaxe du mail utilisé est correcte
    bcrypt
      .hash(req.body.password, 10)
      .then((hashedPassword) => {
        const user = new User({
          email: req.body.email,
          password: hashedPassword,
        });
        user
          .save()
          .then(() => res.status(201).json({ message: "Utilisateur créé." }))
          .catch((error) => res.status(400).json({ message: error }));
      })
      .catch((error) => res.status(500).json({ message: error }));
  } else {
    return res.status(400).json({ message: "Syntaxe de mail incorrecte." });
  }
};

/**
 * Se log sur le site
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
exports.login = (req, res, next) => {
  User.findOne({ email: req.body.email }) // Est-ce que l'utilisateur existe ?
    .then((user) => {
      if (!user) {
        return res
          .status(404)
          .json({ error: "Mail et/ou mot de passe incorrect." });
      }
      bcrypt
        .compare(req.body.password, user.password)
        .then((samePassword) => {
          if (!samePassword) {
            return res
              .status(401)
              .json({ error: "Mail et/ou mot de passe incorrect." });
          }
          res.status(200).json({
            userId: user._id,
            token: jwt.sign(
              // Génération d'un token user, valable 24h
              { userId: user._id },
              process.env.SECRET_KEY, // clé d'encodage unique pour le site, qui sera utilisée pour chaque encodage et qui a été générée aléatoirement en amont
              {
                expiresIn: "24h",
              }
            ),
          });
        })
        .catch((error) => res.status(500).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};
