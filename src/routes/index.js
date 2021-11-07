const admin = require("firebase-admin");
var session;
// var serviceAccount = require(process.env.GOOGLE_APPLICATIONS_CREDENTIALS);

var serviceAccount = require("../../f1-miniatures-firebase-adminsdk-gsdzx-d58bc14ea0.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://f1-miniatures-default-rtdb.europe-west1.firebasedatabase.app/",
});
const db = admin.database();

const express = require("express");
const router = express.Router();
const user = { state: false, type: false };


function login(req, res, next) {
  if (!req.session.userId) {
    res.redirect("/login");
  } else {
    next();
  }
}

function home(req, res, next) {
  if (req.session.userId) {
    res.redirect("/");
  } else {
    next();
  }
}


function isLogged(req, res, next) {
  if (req.session.userId) {
    user.state = true;
  } else {
    user.state = false;
  }
  next();
}

function isAdmin(req, res, next) {
  if (req.body.user == "admin" && req.body.password == 1234) {
    user.type = true;
  } else {
    user.type = false;
  }
  next();
}
function backendperms(req, res, next) {
  if (user.type) {
    next();
  } else {
    res.render("login", {
      title: "no_admin",
      perms: { no_admin: true },
      user,
    });
  }
}



router.get("/", isLogged, (req,res) => {
  const obj1 = db.ref("car").limitToLast(3).get();
  const obj2 = db.ref("cascoss").limitToLast(3).get();
  Promise.all([obj1, obj2]).then(([snapshot1, snapshot2]) => {
    data = snapshot1.val();
    data2 = snapshot2.val();
    res.render("index", {
      car: data,
      cascoss: data2,
      title: "Home",
      active: { Home: true },
      user,
    });
  });
});



router.get("/contacte", isLogged, (req, res) => {
  res.render("contacte", {
    title: "Contacte",
    active: { Contacte: true },
    user,
  });
});


router.get("/quienesSomos", isLogged, (req, res) => {
  res.render("quienesSomos", {
    title: "Quienes Somos",
    active: { QuienesSomos: true },
    user,
  });
});

router.get("/coches", isLogged, (req, res) => {
  db.ref("car").once("value", (snapshot) => {
    data = snapshot.val();
    res.render("coches", {
      car: data,
      title: "Coches",
      active: { Coches: true },
      user,
    });
  });
});

router.get("/afegir_coche", isLogged, (req, res) => {
  res.render("afegir_coche", {
    title: "Añadir Coche",
    user,
  });
});

router.get("/backend", login, isLogged, backendperms, (req, res) => {
  const obj1 = db.ref("car").get();
  const obj2 = db.ref("cascoss").get();
  Promise.all([obj1, obj2]).then(([snapshot1, snapshot2]) => {
    data = snapshot1.val();
    data2 = snapshot2.val();
    res.render("backend", { car: data, cascoss: data2, user });
  });
});

router.post("/new-car", login, isLogged, (req, res) => {
  const newCar = {
    nameCar: req.body.nameCar,
    price: req.body.price,
    year: req.body.year,
    photo: req.body.photo
  };
  db.ref("car").push(newCar);
  res.redirect("/backend");
});

router.get("/delete-car/:id", login, isLogged, (req, res) => {
  db.ref("car/" + req.params.id).remove();
  res.redirect("/backend");
});


router.get("/cascos", isLogged, (req, res) => {
  db.ref("cascoss").once("value", (snapshot) => {
    data = snapshot.val();
    res.render("cascos", {
      cascoss: data,
      title: "Cascos",
      active: { Cascos: true },
      user,
    });
  });
});

router.get("/afegir_casco", isLogged, (req, res) => {
  res.render("afegir_casco", {
    title: "Añadir Casco",
    user,
  });
});

router.post("/new-casco", login, isLogged, (req, res) => {
  const newCar = {
    nameCasco: req.body.nameCasco,
    price: req.body.price,
    year: req.body.year,
    photo: req.body.photo
  };
  db.ref("cascoss").push(newCar);
  res.redirect("/backend");
});

router.get("/delete-casco/:id", login, isLogged, (req, res) => {
  db.ref("cascoss/" + req.params.id).remove();
  res.redirect("/backend");
});
// Session

router.get("/login", isLogged, (req, res) => {
  res.render("login");
});

router.post("/login", isLogged, isAdmin, (req, res) => {
  const { user, password } = req.body;

  if (!user || !password) {
    return res.status(400).send("Fill all the credentials");
  }
  if (user && password) {
    var query = db.ref("users").orderByKey();
    query.once("value").then(function (snapshot) {
      snapshot.forEach(function (childSnapshot) {
        var user = childSnapshot.val().user;
        var pw = childSnapshot.val().password;
        if (req.body.user == "toni" && req.body.password == 1234) {
          req.session.userId = childSnapshot;
          res.redirect("/backend");
        } else if (user == req.body.user && pw == req.body.password) {
          req.session.userId = childSnapshot;
          res.redirect("/");
        }
        res.render("login", {
          title: "login_err",
          err: { login_err: true },
        });
      });
    });
  }
});

router.post("/logout", isLogged, function (req, res) {
  req.session.userId = null;
  user.type = false;
  res.send("ok");
});


module.exports = router;

