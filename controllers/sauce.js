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
  console.log(req.body);
};
