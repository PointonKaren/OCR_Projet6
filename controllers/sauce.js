const Sauce = require("../models/sauce");
const fileSystem = require("fs");

exports.getSauces = (req, res, next) => {
  Sauce.find()
    // La méthode find renvoie une promise qui, une fois résolue, donne un tableau contenant les objets de ce type
    .then((sauces) => {
      res.status(200).json(sauces);
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({
    _id: req.params.id,
    //findOne fonctionne comme find sauf qu'on lui précise le(s) paramètre(s) de recherche
  })
    .then((sauce) => {
      res.status(200).json(sauce);
    })
    .catch((error) => {
      res.status(404).json({ error });
    });
};

exports.createSauce = (req, res, next) => {
  const sauceData = JSON.parse(req.body.sauce);
  // Convertir l'objet Sauce contenu dans le body d'un string en objet json

  const sauce = new Sauce({
    userId: sauceData.userId,
    name: sauceData.name,
    manufacturer: sauceData.manufacturer,
    description: sauceData.description,
    mainPepper: sauceData.mainPepper,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`, // Permet de générer l'url de l'image qui sera de type, par exemple http://localhost:3000/images/monimage_timestamp.extension
    // le "host" est l'adresse url du serveur (localhost:xxxx, ip, hottakes etc...)
    heat: sauceData.heat,
    likes: 0,
    dislikes: 0,
    usersLiked: [],
    usersDisliked: [],
  });
  // Crée l'objet Sauce en suivant les spécificités imposées.

  sauce
    .save() // Intègre dans la BDD les infos contenues dans la variable sauce. Cette intégration renvoie une promise qui doit être résolue par .then et .catch
    .then(() => {
      res.status(201).json({
        message: "Sauce ajoutée.",
      });
    }) // Si l'intégration s'est bien passée, renvoyer un message "Sauce ajoutée."
    .catch((error) => {
      res.status(400).json({ error });
    }); // Si l'intégration se passe mal, la promise renvoie une erreur. La réponse prend un statut 400 et communique l'erreur survenue.
};

exports.modifySauce = (req, res, next) => {
  let updatedSauce;

  if (req.file) {
    updatedSauce = {
      ...JSON.parse(req.body.sauce),
      imageUrl: `${req.protocol}://${req.get("host")}/images/${
        req.file.filename
      }`,
    };
  } else {
    updatedSauce = { ...req.body };
  }

  if (updatedSauce.userId !== req.auth.userId) {
    return res.status(403).json({ error: "Requête non autorisée." });
  } // Empêche les petits malins de contourner le fait qu'on ne puisse modifier que les sauces que nous avons ajoutées.
  // (Le front ne le permet cela dit pas, car absence du bouton modifier)
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

exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (!sauce) {
        res.status(404).json({ error: "La sauce n'existe pas." });
      }
      if (sauce.userId !== req.auth.userId) {
        res.status(403).json({ error: "Requête non autorisée." });
      } // Empêche les petits malins de contourner le fait qu'on ne puisse supprimer que les sauces que nous avons ajoutées.
      // (Le front ne le permet cela dit pas, car absence du bouton supprimer)

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

exports.rateSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      let userHasLiked = sauce.usersLiked.indexOf(req.body.userId) != -1; // Si l'id de l'user est dans le tableau "a aimé"
      let userHasDisliked = sauce.usersDisliked.indexOf(req.body.userId) != -1; // Si l'id de l'user est dans le tableau "n'a pas aimé"

      if (req.body.like == 0) {
        // Si l'user annule son like/son dislike

        if (userHasLiked) {
          // S'il avait like

          Sauce.updateOne(
            { _id: req.params.id },
            {
              $inc: { likes: -1 },
              $pull: { usersLiked: req.body.userId },
              _id: req.params.id,
            }
          )
            // On retire un like pour cette sauce et l'user du tableau des users ayant aimé cette sauce

            .then(() => {
              res.status(200).json({ message: "Like retiré." });
            }) // Confirme le retrait du like

            .catch((error) => {
              res.status(400).json({ error });
            }); //  Signale l'erreur survenue le cas échéant
        } else if (userHasDisliked) {
          // S'il avait dislike

          Sauce.updateOne(
            { _id: req.params.id },
            {
              $inc: { dislikes: -1 },
              $pull: { usersDisliked: req.body.userId },
              _id: req.params.id,
            }
          )
            // On retire un dislike pour cette sauce et l'user du tableau des users n'ayant pas aimé cette sauce

            .then(() => {
              res.status(200).json({ message: "Dislike retiré." });
            })
            .catch((error) => {
              res.status(400).json({ error });
            });
        } else {
          // Si un user essaie de retirer un like/dislike qu'il n'avait pas fait, la requête échoue avec erreur 403 ci-dessous :

          return res.status(403).json({ error: "Requête non autorisée." });
        }
      } else if (req.body.like == 1) {
        // Si l'user like la sauce

        if (userHasLiked == false && userHasDisliked == false) {
          // S'il n'a pas déjà like et dislike la sauce

          Sauce.updateOne(
            { _id: req.params.id },
            {
              $inc: { likes: 1 },
              $push: { usersLiked: req.body.userId },
              _id: req.params.id,
            }
          ) // Ajout d'un like et ajout de l'user dans le tableau des likes

            .then(() => {
              res.status(200).json({ message: "Sauce likée." });
            })
            .catch((error) => {
              res.status(400).json({ error });
            });
        } else {
          // Si user a déjà like et/ou dislike -> erreur 403 car techniquement impossible (sécurité prévue pour éviter la surcharge de la BDD)
          return res.status(403).json({ error: "Requête non autorisée." });
        }
      } else if (req.body.like == -1) {
        // Si l'user dislike la sauce

        if (userHasDisliked == false && userHasLiked == false) {
          // Si l'user n'a pas déjà dislike et like
          Sauce.updateOne(
            { _id: req.params.id },
            {
              $inc: { dislikes: 1 },
              $push: { usersDisliked: req.body.userId },
              _id: req.params.id,
            }
          )
            // Ajouter un dislike pour la sauce et l'userId dans le tableau des users qui n'aiment pas la sauce
            .then(() => {
              res.status(200).json({ message: "Sauce dislikée." });
            })
            .catch((error) => {
              res.status(400).json({ error });
            });
        } else {
          // Si user a déjà like et/ou dislike -> erreur 403 car techniquement impossible (sécurité prévue pour éviter la surcharge de la BDD)
          return res.status(403).json({ error: "Requête non autorisée." });
        }
      } else {
        // Si l'user essaie de mettre autre chose que 0 (annule son choix), 1 (like) ou -1 (dislike) -> erreur 400
        return res.status(400).json({ error: "Mauvaise requête." });
      }
    })
    .catch((error) => {
      res.status(404).json({ error });
    }); // Si la sauce n'a pas été touvée, bretelle de la ceinture ;)
};
