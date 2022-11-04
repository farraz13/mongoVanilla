const { match } = require("assert");
var express = require("express");
var router = express.Router();
var moment = require("moment");
var { ObjectId } = require('mongodb');

/* GET home page. */
module.exports = function (db) {
  router.get("/", async function (req, res) {
    try {

      const page = req.query.page || 1;
      const limit = 3;
      const offset = limit == 'all' ? 0 : (page - 1) * limit;
      const wheres = {};
      const sortMongo = {};

      let sortBy = req.query.sortBy || "strings"
      let sortMode = req.query.sortMode || "asc"

      sortMongo[sortBy] = sortMode == "asc" ? 1 : -1;

      if (req.query.string) {
        wheres["strings"] = new RegExp(`${req.query.string}`, 'i')
      }

      if (req.query.integer) {
        wheres["integers"] = parseInt(req.query.integer)
      }

      if (req.query.float) {
        wheres["floats"] = JSON.parse(req.query.float)
      }


      if (req.query.startDate && req.query.endDate) {
        wheres["dates"] = {
          $gte: new Date(`${req.query.startDate}`),
          $lte: new Date(`${req.query.endDate}`)
        }
      } else if (req.query.startDate) {
        wheres["dates"] = { $gte: new Date(`${req.query.startDate}`) }
      } else if (req.query.endDate) {
        wheres["dates"] = { $lte: new Date(`${req.query.endDate}`) }
      }


      if (req.query.boolean) {
        wheres["booleans"] = (req.query.boolean)
      }

      const result = await db.collection("farraz").find(wheres).toArray()
      var total = result.length;
      const pages = Math.ceil(total / limit);
      const data = await db.collection("farraz").find(wheres).skip(offset).limit(limit).sort(sortMongo).toArray()
      res.json({
        success: true,
        data,
        pages,
        limit,
        offset
      })
    } catch (err) {
      res.json(err, { success: false })
    }
  });

  router.post("/", async (req, res) => {
    try {
      var myobj = {
        strings: `${req.body.string}`,
        integers: parseInt(req.body.integer),
        floats: parseFloat(req.body.float),
        dates: new Date(`${req.body.date}`),
        booleans: JSON.parse(req.body.boolean),
      };
      const data = await db.collection("farraz").insertOne(myobj);
      res.json({ success: true, data });
    } catch (err) {
      res.json(err, { success: false });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const data = await db
        .collection("farraz")
        .deleteOne({ '_id': ObjectId(`${req.params.id}`) });
      res.json({ success: true, data });
    } catch (err) {
      res.json(err, { success: false });
    }
  });

  router.put("/:id", async (req, res) => {
    try {
      var myobj = {
        strings: req.body.string,
        integers: parseInt(req.body.integer),
        floats: parseFloat(req.body.float),
        dates: req.body.date,
        booleans: JSON.parse(req.body.boolean),
      };

      const update = await db.collection("farraz").updateOne(
        { "_id": ObjectId(`${req.params.id}`) },
        { $set: myobj }
      )
      res.json({ success: true, update });
    } catch (err) {
      res.json(err, { success: false });
    }
  });

  return router;
};
