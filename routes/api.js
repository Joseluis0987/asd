'use strict';
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { MongoClient } = require('mongodb');
require('dotenv').config();
const superagent = require('superagent');
const bcrypt = require('bcrypt');

module.exports = function (app) {

  app.route('/api/stock-prices/')
    .get( (req, res) => {
      let ip, a, b, liked, url, data1, data2, json
      ip = bcrypt.hashSync(req.socket.remoteAddress, bcrypt.genSaltSync(12));
      if (typeof req.query.stock === 'object') {
        [a, b] = req.query.stock;
      } else {
        a = req.query.stock
      }
      liked = req.query.like;
      (async () => {
        try {
          const response = await superagent.get(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${a}/quote`)
          data1 = {
            "stock": response.body.symbol,
            "price": response.body.latestPrice
          }
        } catch (error) {
          console.log(error.response.body);
        }
        if (b){
          try {
            const response = await superagent.get(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${b}/quote`)
            data2 = {
              "stock": response.body.symbol,
              "price": response.body.latestPrice
            }
          } catch (error) {
            console.log(error.response.body);
          }
        }

        const db = "mongodb+srv://harishijo:AygkTqmxvvxhP69E@cluster0.npi1uww.mongodb.net/?retryWrites=true&w=majority";
        const client = new MongoClient(db, { useNewUrlParser: true, useUnifiedTopology: true });
        let res1, res2, ipSaved;

        res1 = await client.db("stock").collection("likes").findOne({stock: a.toUpperCase()});
        if (b) res2 = await client.db("stock").collection("likes").findOne({stock: b.toUpperCase()});
        if (b) {
          data1['rel_likes'] = res1["likes"] - res2["likes"];
          data2['rel_likes'] = res2["likes"] - res1["likes"];
        } else {
          data1["likes"] = res1["likes"];
        }
        try {
          await client.connect();
          if (liked == 'true') {
            ipSaved = false;
            await client.db("stock").collection("IP").find({}).forEach((el) => {
              let x = bcrypt.compareSync(req.socket.remoteAddress, el.IP);
              if (x) ipSaved = true;
            });
            if (!ipSaved) {
              await client.db("stock").collection("IP").insertOne({"IP": ip});
              await client.db("stock").collection("likes").updateOne({stock: a.toUpperCase()}, {$inc: {likes: 1}});
              if (b) {
                await client.db("stock").collection("likes").updateOne({stock: b.toUpperCase()}, {$inc: {likes: 1}});
              }
            }
          }
          if (b){
            json = {
              "stockData" : [data1, data2]
            }
          } else {
            json = {
              "stockData" : data1
            }
          }
        } catch(e) {
          console.error(e);
        } finally {
          await client.close();
        }
        res.json(json)
      })();
  });
};