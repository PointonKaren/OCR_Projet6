const multer = require("multer");

// multer est un package de gestion de fichiers

const MIME_TYPES = {
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "image/png": "png",
}; // Dictionnaire des extensions

const storage = multer.diskStorage({
  // diskStorage configure le chemin et le nom de fichier pour les fichiers entrants.
  destination: (req, file, callback) => {
    callback(null, "images");
  }, // Dit à Multer d'enregistrer les fichiers dans le dossier images
  filename: (req, file, callback) => {
    const name = file.originalname.replace(" ", "_");
    // Donne au fichier un nouveau nom composé de son nom d'origine dont on a remplacé les espaces par des _

    const extension = MIME_TYPES[file.mimetype];
    // utilise le dico pour dire "si un fichier est reconnu comme étant un jpg, l'extension est jpg"

    callback(null, `${name}_${Date.now()}.${extension}`);
    // Génère un nom de fichier composé ainsi : name_timestamp.extension
  },
});

module.exports = multer({ storage }).single("image");
// Exporte le middleware qui possède la stratégie de stockage définie auparavant et qui ne sera utilisable que pour des fichiers de type "image"
