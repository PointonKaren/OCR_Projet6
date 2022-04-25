const Sauce = require("../models/sauce");
const fileSystem = require("fs");

/**
 * Récupérer toutes les sauces
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
exports.getSauces = (req, res, next) => {
  Sauce.find()
    .then((sauces) => {
      res.status(200).json(sauces);
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

/**
 * Récupérer une sauce précise
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({
    _id: req.params.id,
  })
    .then((sauce) => {
      res.status(200).json(sauce);
    })
    .catch((error) => {
      res.status(404).json({ error });
    });
};

/**
 * Créer une sauce
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 */
exports.createSauce = (req, res, next) => {
  const sauceData = JSON.parse(req.body.sauce);
  if (!req.file) {
    return res.status(400).json({ error: "Fichier absent ou inattendu." });
  }

  const sauce = new Sauce({
    userId: sauceData.userId,
    name: sauceData.name,
    manufacturer: sauceData.manufacturer,
    description: sauceData.description,
    mainPepper: sauceData.mainPepper,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
    heat: sauceData.heat,
    likes: 0,
    dislikes: 0,
    usersLiked: [],
    usersDisliked: [],
  });
  sauce
    .save()
    .then(() => {
      res.status(201).json({
        message: "Sauce ajoutée.",
      });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

/**
 * Modifier une sauce
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 */
exports.modifySauce = (req, res, next) => {
  let updatedSauce;

  // 2 cas possibles : soit l'utilisateur modifie notamment l'image, soit il ne touche pas à l'image et ne modifie que le contenu du formulaire
  if (req.file) {
    updatedSauce = {
      ...JSON.parse(req.body.sauce),
      imageUrl: `${req.protocol}://${req.get("host")}/images/${
        req.file.filename
      }`,
    };
    Sauce.findOne({ _id: req.params.id })
      .then((sauce) => {
        const imageName = sauce.imageUrl.split("images/")[1];
        fileSystem.unlink(`images/${imageName}`, () => {});
      })
      .catch((error) => res.status(500).json({ error }));
  } else {
    if (!req.body.sauce) {
      updatedSauce = { ...req.body };
    } else {
      return res.status(400).json({ error: "Format de fichier inattendu." });
    }
  }

  if (updatedSauce.userId !== req.auth.userId) {
    return res.status(403).json({ error: "Requête non autorisée." });
  }
  Sauce.updateOne(
    { _id: req.params.id },
    { ...updatedSauce, _id: req.params.id }
  )
    .then(() => {
      res.status(201).json({ message: "Sauce modifiée." });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

/**
 * Supprimer une sauce
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (!sauce) {
        res.status(404).json({ error: "La sauce n'existe pas." });
      }
      if (sauce.userId !== req.auth.userId) {
        res.status(403).json({ error: "Requête non autorisée." });
      }
      const filename = sauce.imageUrl.split("/images/")[1];
      fileSystem.unlink(`images/${filename}`, () => {
        Sauce.deleteOne({ _id: req.params.id })
          .then(() => {
            res.status(200).json({ message: "Sauce supprimée." });
          })
          .catch((error) => {
            res.status(400).json({ error });
          });
      });
    })
    .catch((error) => {
      res.status(404).json({ error });
    });
};

/**
 * Noter une sauce
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
exports.rateSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      let userHasLiked = sauce.usersLiked.indexOf(req.body.userId) != -1; // L'id de l'user est dans le tableau "a aimé"
      let userHasDisliked = sauce.usersDisliked.indexOf(req.body.userId) != -1; // L'id de l'user est dans le tableau "n'a pas aimé"

      // Retirer son like/dislike
      if (req.body.like == 0) {
        if (userHasLiked) {
          Sauce.updateOne(
            { _id: req.params.id },
            {
              $inc: { likes: -1 },
              $pull: { usersLiked: req.body.userId },
              _id: req.params.id,
            }
          )
            .then(() => {
              res.status(200).json({ message: "Like retiré." });
            })

            .catch((error) => {
              res.status(400).json({ error });
            });
        } else if (userHasDisliked) {
          Sauce.updateOne(
            { _id: req.params.id },
            {
              $inc: { dislikes: -1 },
              $pull: { usersDisliked: req.body.userId },
              _id: req.params.id,
            }
          )

            .then(() => {
              res.status(200).json({ message: "Dislike retiré." });
            })
            .catch((error) => {
              res.status(400).json({ error });
            });
        } else {
          return res.status(403).json({ error: "Requête non autorisée." });
        }
      } else if (req.body.like == 1) {
        // Like une sauce
        if (userHasLiked == false && userHasDisliked == false) {
          Sauce.updateOne(
            { _id: req.params.id },
            {
              $inc: { likes: 1 },
              $push: { usersLiked: req.body.userId },
              _id: req.params.id,
            }
          )
            .then(() => {
              res.status(200).json({ message: "Sauce likée." });
            })
            .catch((error) => {
              res.status(400).json({ error });
            });
        } else {
          return res.status(403).json({ error: "Requête non autorisée." });
        }
      } else if (req.body.like == -1) {
        // Dislike une sauce
        if (userHasDisliked == false && userHasLiked == false) {
          Sauce.updateOne(
            { _id: req.params.id },
            {
              $inc: { dislikes: 1 },
              $push: { usersDisliked: req.body.userId },
              _id: req.params.id,
            }
          )
            .then(() => {
              res.status(200).json({ message: "Sauce dislikée." });
            })
            .catch((error) => {
              res.status(400).json({ error });
            });
        } else {
          return res.status(403).json({ error: "Requête non autorisée." });
        }
      } else {
        return res.status(400).json({ error: "Mauvaise requête." });
      }
    })
    .catch((error) => {
      res.status(404).json({ error });
    });
};
