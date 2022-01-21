const Veg = require("../models/veg");
const Month = require("../models/month");

const async = require("async");
const multer = require("multer");
const upload = multer({ dest: "public/uploads" });

const { body, validationResult } = require("express-validator");

exports.index = function (req, res) {
  async.parallel(
    {
      veg_count: function (callback) {
        Veg.countDocuments({}, callback);
      },
      month_count: function (callback) {
        Month.countDocuments({}, callback);
      },
      month: function (callback) {
        Month.find().exec(callback);
      },
      vegs: function (callback) {
        Veg.find().exec(callback);
      },
    },
    function (err, results) {
      res.render("index", {
        title: "Veggies of the world",
        error: err,
        data: results,
      });
    },
  );
};

exports.veg_list = function (req, res, next) {
  Veg.find()
    .select("name species description")
    .exec(function (err, vegs) {
      if (err) {
        return next(err);
      }
      // Successful, so render
      res.render("veg_list", { title: "Veggie List", vegs: vegs });
    });
};

exports.veg_detail = function (req, res, next) {
  async.parallel(
    {
      veg: function (callback) {
        Veg.findOne({ name: req.params.name })
          .populate("sow", "name")
          .populate("harvest", "name")
          .exec(callback);
      },
      month: function (callback) {
        Month.find().select("name").exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.veg == null) {
        var err = new Error("Veg not found");
        err.status = 404;
        return next(err);
      }
      res.render("veg_detail", {
        title: results.veg.name,
        veg: results.veg,
        months: results.months,
      });
    },
  );
};

exports.veg_create_get = function (req, res, next) {
  Month.find().exec(function (err, months) {
    if (err) {
      return next(err);
    }
    res.render("veg_form", { title: "Add a new Veggie", months: months });
  });
};

exports.veg_create_post = [
  (req, res, next) => {
    if (!(req.body.sow instanceof Array)) {
      if (typeof req.body.sow === "undefined") req.body.sow = [];
      else req.body.sow = new Array(req.body.sow);
    }
    if (!(req.body.harvest instanceof Array)) {
      if (typeof req.body.harvest === "undefined") req.body.harvest = [];
      else req.body.harvest = new Array(req.body.harvest);
    }
    next();
  },

  body("name", "Name must not be blank").trim().isLength({ min: 1 }).escape(),
  body("species", "Needs species").trim().isLength({ min: 1 }).escape(),
  body("description", "Needs description").trim().isLength({ min: 1 }).escape(),
  body("sow.*").escape(),
  body("harvest.*").escape(),

  (req, res, next) => {
    const errors = validationResult(req);
    const veg = new Veg({
      name: req.body.name,
      species: req.body.species,
      description: req.body.description,
      sow: req.body.sow,
      harvest: req.body.harvest,
      maturation: req.body.maturation,
      stock: req.body.stock,
    });

    if (!errors.isEmpty()) {
      Month.find().exec(function (err, months) {
        if (err) {
          return next(err);
        }
        res.render("veg_form", {
          title: "Add Veggie",
          months: months,
          veg: veg,
          errors: errors.array(),
        });
      });
    } else {
      veg.save(function (err) {
        if (err) {
          return next(err);
        }
        res.redirect(veg.name);
      });
    }
  },
];

exports.veg_delete_post = function (req, res, next) {
  Veg.findOne({ name: req.params.name }).exec(function (err, veg) {
    if (err) {
      return next(err);
    }
    if (veg == null) {
      let err = new Error("Veggie not found to delete!");
      err.status = 404;
      return next(err);
    }
    res.render("veg_delete", { title: "Delete" + veg.name, veg: veg });
  });
};

exports.veg_delete_post = function (req, res, next) {
  Veg.findByIdAndRemove(req.body.vegid, function deleteVeg(err) {
    if (err) {
      return next(err);
    }
    res.render("veg_deleted", {
      title: req.params.name + " deleted",
      veg_name: req.params.name,
    });
  });
};

exports.veg_update_get = function (req, res, next) {
  async.parallel(
    {
      veg: function (callback) {
        Veg.findOne({ name: req.params.name })
          .populate("sow")
          .populate("harvest")
          .exec(callback);
      },
      months: function (callback) {
        Month.find(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.veg == null) {
        let err = new Error("Veg not found");
        err.status = 404;
        return next(err);
      }
      res.render("veg_form", {
        title: "Update Vegetable",
        months: results.months,
        veg: results.veg,
      });
    },
  );
};

exports.veg_update_post = [
  (req, res, next) => {
    if (!(req.body.sow instanceof Array)) {
      if (typeof req.body.sow === "undefined") req.body.sow = [];
      else req.body.sow = new Array(req.body.sow);
    }
    if (!(req.body.harvest instanceof Array)) {
      if (typeof req.body.harvest === "undefined") req.body.harvest = [];
      else req.body.harvest = new Array(req.body.harvest);
    }
    next();
  },

  body("name", "Name must not be blank.").trim().isLength({ min: 1 }).escape(),
  body("species", "Needs species.").trim().isLength({ min: 1 }).escape(),
  body("description", "Needs desc.").trim().isLength({ min: 1 }).escape(),
  body("sow.*").escape(),
  body("harvest.*").escape(),

  (req, res, next) => {
    const errors = validationResult(req);

    var veg = new Veg({
      name: req.body.name,
      species: req.body.species,
      description: req.body.description,
      sow: typeof req.body.sow === "undefined" ? [] : req.body.sow,
      harvest: typeof req.body.harvest === "undefined" ? [] : req.body.harvest,
      maturation: req.body.maturation,
      stock: req.body.stock,
      _id: req.body.vegid,
    });

    if (!errors.isEmpty()) {
      Month.find().exec(function (err, months) {
        if (err) {
          return next(err);
        }

        for (let i = 0; i < months.length; i++) {
          if (veg.month.indexOf(months[i]._id) > -1) {
            months[i].checked = "true";
          }
        }
        res.render("veg_form", {
          title: "Add Veg",
          months: months,
          veg: veg,
          errors: errors.array(),
        });
      });
      return;
    } else {
      Veg.findByIdAndUpdate(req.body.vegid, veg, {}, function (err, veg) {
        if (err) {
          return next(err);
        }
        res.redirect("/veg/" + req.body.name);
      });
    }
  },
];

exports.veg_addphoto_get = function (req, res, next) {
  Veg.findOne({ name: req.params.name }).exec(function (err, veg) {
    if (err) {
      return next(err);
    }
    if (veg == null) {
      var err = new Error("Veg not found!");
      err.status = 404;
      return next(err);
    }
    res.render("veg_addphoto", { title: "Add photo to " + veg.name, veg: veg });
  });
};

exports.veg_addphoto_post = [
  upload.single("avatar"),
  function (req, res, next) {
    // Veg.findOne({ 'name' : req.params.name})
    // .exec(function(err, veg) {
    //   if (err) {return next(err);}
    //   if (veg==null) {
    //     var err = new Error('Veg not found!');
    //     err.status = 404;
    //     return next(err);
    //   }
    Veg.findByIdAndUpdate(
      req.body.vegid,
      { image: req.file.filename },
      {},
      function (err, veg) {
        if (err) {
          return next(err);
        }
        // res.redirect('/veg/' + req.body.name);
        res.render("veg_addedphoto", {
          title: "Added photo to ",
          file: req.file,
          veg: veg,
          idd: req.body.vegid,
        });
      },
    );
  },
];

exports.month_detail = function (req, res, next) {
  async.waterfall(
    [
      function (callback) {
        Month.find({ name: req.params.name })
          .populate("month")
          .exec(function (err, month) {
            callback(null, month);
          });
      },

      function (month, callback) {
        Veg.find({ sow: month.id })
          .populate("veg")
          .exec(function (err, sow_veg) {
            callback(null, { sow_veg, month });
          });
      },

      function ({ sow_veg, month }, callback) {
        Veg.find({ harvest: month.id })
          .populate("veg")
          .exec(function (err, harvest) {
            callback(null, { harvest_veg, sow_veg, month });
          });
      },
    ],
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results == null) {
        var err = new Error("Month not found");
        err.status = 404;
        return next(err);
      }
      res.render("month_detail", {
        title: results.month.name,
        month: results.month,
        sow_veg: results.sow_veg,
        harvest_veg: results.harvest_veg,
      });
    },
  );
};
